import sys
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine, Base
from app.seed import seed_database
from app.models import User, ArtisanProfile, Skill, Booking, Bid, Review, KYCVerification, UserRole, KYCStatus, SkillTestStatus, BookingStatus, BidStatus

client = TestClient(app)

class TestComprehensiveAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Reset tables & seed database cleanly
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        seed_database()

    # --- 1. HEALTH & ROOT ENDPOINTS ---
    def test_01_root_and_health_check(self):
        r1 = client.get("/")
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["status"], "online")
        self.assertIn("docs_url", r1.json())

        r2 = client.get("/api/health")
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["status"], "ok")

    # --- 2. AUTHENTICATION & USER MANAGEMENT ENDPOINTS ---
    def test_02_register_customer(self):
        payload = {
            "name": "Zainab Bello",
            "email": "zainab@example.com",
            "phone": "+2348011223344",
            "password": "securepassword123",
            "role": "customer",
            "location_name": "Keffi Central"
        }
        res = client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["email"], "zainab@example.com")
        self.assertEqual(data["role"], "customer")
        self.assertIsNone(data["artisan_profile"])

    def test_03_register_artisan(self):
        payload = {
            "name": "Usman Garba",
            "email": "usman@mechanics.ng",
            "phone": "+2348022334455",
            "password": "securepassword123",
            "role": "artisan",
            "location_name": "Station Road Keffi",
            "bio": "Experienced auto mechanic & generator repairer.",
            "trade_category": "Auto Mechanics",
            "hourly_rate": 4000.0,
            "years_experience": 5
        }
        res = client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["role"], "artisan")
        self.assertIsNotNone(data["artisan_profile"])
        self.assertEqual(data["artisan_profile"]["trade_category"], "Auto Mechanics")

    def test_04_register_duplicate_email_fails(self):
        payload = {
            "name": "Duplicate User",
            "email": "amina@gmail.com",  # Already seeded
            "phone": "+2348000000000",
            "password": "password123",
            "role": "customer"
        }
        res = client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.json()["detail"])

    def test_05_login_json(self):
        res = client.post("/api/auth/login", json={"email": "tunde@plumbing.ng", "password": "password123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "artisan")
        self.assertEqual(data["name"], "Tunde Bakare")
        self.assertIn("access_token", data)

    def test_06_login_oauth2_form(self):
        res = client.post("/api/auth/token", data={"username": "admin@artisanhub.ng", "password": "password123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "admin")
        self.assertIn("access_token", data)

    def test_07_login_invalid_password_fails(self):
        res = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "wrongpassword"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect email or password", res.json()["detail"])

    def test_08_get_me(self):
        login_res = client.post("/api/auth/login", json={"email": "amina@gmail.com", "password": "password123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/auth/me", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "amina@gmail.com")

    # --- 3. ARTISAN DIRECTORY & DISCOVERY ENDPOINTS ---
    def test_09_get_all_artisans(self):
        res = client.get("/api/artisans")
        self.assertEqual(res.status_code, 200)
        artisans = res.json()
        self.assertGreaterEqual(len(artisans), 4)

    def test_10_filter_artisans_by_category(self):
        res = client.get("/api/artisans?trade_category=Electrical")
        self.assertEqual(res.status_code, 200)
        artisans = res.json()
        self.assertTrue(all("Electrical" in a["artisan_profile"]["trade_category"] for a in artisans))

    def test_11_filter_artisans_verified_only(self):
        res = client.get("/api/artisans?verified_only=true")
        self.assertEqual(res.status_code, 200)
        artisans = res.json()
        for a in artisans:
            self.assertEqual(a["artisan_profile"]["kyc_status"], "approved")
            self.assertEqual(a["artisan_profile"]["skill_test_status"], "passed")

    def test_12_filter_artisans_keyword_search(self):
        res = client.get("/api/artisans?search=Station")
        self.assertEqual(res.status_code, 200)
        artisans = res.json()
        self.assertGreaterEqual(len(artisans), 1)

    def test_13_filter_artisans_min_rating(self):
        res = client.get("/api/artisans?min_rating=4.9")
        self.assertEqual(res.status_code, 200)
        artisans = res.json()
        for a in artisans:
            self.assertGreaterEqual(a["artisan_profile"]["rating_avg"], 4.9)

    def test_14_get_artisan_detail_by_id(self):
        res_list = client.get("/api/artisans")
        art_id = res_list.json()[0]["id"]
        res_detail = client.get(f"/api/artisans/{art_id}")
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(res_detail.json()["id"], art_id)

    def test_15_get_nonexistent_artisan_fails(self):
        res = client.get("/api/artisans/999999")
        self.assertEqual(res.status_code, 404)

    def test_16_update_artisan_profile(self):
        login_res = client.post("/api/auth/login", json={"email": "tunde@plumbing.ng", "password": "password123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        update_payload = {
            "bio": "Updated bio: Senior plumber with 10 years experience.",
            "hourly_rate": 3500.0,
            "years_experience": 10
        }
        res = client.put("/api/artisans/profile", params=update_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["hourly_rate"], 3500.0)
        self.assertEqual(data["years_experience"], 10)

    # --- 4. SKILLS & ASSESSMENT QUIZ ENDPOINTS ---
    def test_17_get_all_skills(self):
        res = client.get("/api/skills")
        self.assertEqual(res.status_code, 200)
        skills = res.json()
        self.assertGreaterEqual(len(skills), 5)
        self.assertIn("questions", skills[0])

    def test_18_get_skill_detail(self):
        skills = client.get("/api/skills").json()
        skill_id = skills[0]["id"]
        res = client.get(f"/api/skills/{skill_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], skill_id)

    def test_19_submit_quiz_passing(self):
        login_res = client.post("/api/auth/login", json={"email": "chidi@woodcraft.ng", "password": "password123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        skills = client.get("/api/skills").json()
        carp_skill = next(s for s in skills if "Carpentry" in s["name"])
        qs = carp_skill["questions"]

        submission = {
            "skill_id": carp_skill["id"],
            "answers": [
                {"question_id": qs[0]["id"], "selected_option": "B"},
                {"question_id": qs[1]["id"], "selected_option": "B"}
            ]
        }
        res = client.post("/api/skills/submit-quiz", json=submission, headers=headers)
        self.assertEqual(res.status_code, 200)
        result = res.json()
        self.assertEqual(result["score_percentage"], 100.0)
        self.assertTrue(result["passed"])
        self.assertEqual(result["skill_test_status"], "passed")

    def test_20_submit_quiz_failing(self):
        login_res = client.post("/api/auth/login", json={"email": "usman@mechanics.ng", "password": "securepassword123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        skills = client.get("/api/skills").json()
        plumb_skill = next(s for s in skills if "Plumbing" in s["name"])
        qs = plumb_skill["questions"]

        # All wrong answers
        submission = {
            "skill_id": plumb_skill["id"],
            "answers": [
                {"question_id": qs[0]["id"], "selected_option": "A"},
                {"question_id": qs[1]["id"], "selected_option": "A"},
                {"question_id": qs[2]["id"], "selected_option": "A"}
            ]
        }
        res = client.post("/api/skills/submit-quiz", json=submission, headers=headers)
        self.assertEqual(res.status_code, 200)
        result = res.json()
        self.assertEqual(result["score_percentage"], 0.0)
        self.assertFalse(result["passed"])
        self.assertEqual(result["skill_test_status"], "failed")

    # --- 5. KYC & IDENTITY VERIFICATION GATE ENDPOINTS ---
    def test_21_submit_kyc_token(self):
        login_res = client.post("/api/auth/login", json={"email": "usman@mechanics.ng", "password": "securepassword123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {"id_type": "NIN", "id_token": "NIN-778899001122"}
        res = client.post("/api/kyc/submit", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id_token"], "NIN-778899001122")
        self.assertEqual(data["status"], "pending")

    def test_22_get_my_kyc_history(self):
        login_res = client.post("/api/auth/login", json={"email": "usman@mechanics.ng", "password": "securepassword123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/kyc/status", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json()), 1)

    def test_23_admin_get_pending_kyc(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/kyc/pending", headers=headers)
        self.assertEqual(res.status_code, 200)
        pending_list = res.json()
        self.assertGreaterEqual(len(pending_list), 1)

    def test_24_admin_approve_kyc(self):
        admin_login = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        admin_token = admin_login.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        pending = client.get("/api/kyc/pending", headers=headers_admin).json()
        kyc_id = pending[0]["id"]

        res = client.post(f"/api/kyc/approve/{kyc_id}", json={"approved": True, "notes": "Approved by admin."}, headers=headers_admin)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "approved")

    # --- 6. SERVICE BOOKINGS & NEGOTIABLE BIDS ENDPOINTS ---
    def test_25_create_booking_request(self):
        cust_login = client.post("/api/auth/login", json={"email": "amina@gmail.com", "password": "password123"})
        token = cust_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        skills = client.get("/api/skills").json()
        elec_skill = next(s for s in skills if "Electrical" in s["name"])

        payload = {
            "skill_id": elec_skill["id"],
            "title": "Ceiling Fan Regulator Replacement",
            "description": "Sitting room ceiling fan regulator sparking.",
            "address": "Highland Quarters Keffi",
            "emergency_level": "low",
            "budget": 3500.0
        }
        res = client.post("/api/bookings", json=payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["title"], "Ceiling Fan Regulator Replacement")
        self.assertEqual(data["status"], "requested")

    def test_26_list_bookings_and_filter(self):
        res = client.get("/api/bookings")
        self.assertEqual(res.status_code, 200)
        bookings = res.json()
        self.assertGreaterEqual(len(bookings), 3)

        # Filter by status
        res_open = client.get("/api/bookings?status=bidding_open")
        self.assertEqual(res_open.status_code, 200)

    def test_27_get_booking_detail(self):
        bookings = client.get("/api/bookings").json()
        self.assertIsInstance(bookings, list)
        booking_id = bookings[0]["id"]

        res = client.get(f"/api/bookings/{booking_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], booking_id)

    def test_28_submit_and_update_artisan_bid(self):
        # 1. Customer creates booking
        cust_login = client.post("/api/auth/login", json={"email": "zainab@example.com", "password": "securepassword123"})
        cust_token = cust_login.json()["access_token"]
        headers_cust = {"Authorization": f"Bearer {cust_token}"}

        skills = client.get("/api/skills").json()
        carp_skill = next(s for s in skills if "Carpentry" in s["name"])

        b_payload = {
            "skill_id": carp_skill["id"],
            "title": "Broken Wooden Door Latch",
            "description": "Main entrance door latch broken.",
            "address": "Keffi Central",
            "emergency_level": "medium",
            "budget": 4500.0
        }
        book_res = client.post("/api/bookings", json=b_payload, headers=headers_cust)
        booking_id = book_res.json()["id"]

        # 2. Artisan Chidi submits bid
        art_login = client.post("/api/auth/login", json={"email": "chidi@woodcraft.ng", "password": "password123"})
        art_token = art_login.json()["access_token"]
        headers_art = {"Authorization": f"Bearer {art_token}"}

        bid_payload = {
            "booking_id": booking_id,
            "proposed_price": 4000.0,
            "estimated_hours": 2,
            "notes": "Will bring heavy duty brass latch."
        }
        res_bid = client.post(f"/api/bookings/{booking_id}/bids", json=bid_payload, headers=headers_art)
        self.assertEqual(res_bid.status_code, 200)
        self.assertEqual(res_bid.json()["proposed_price"], 4000.0)

        # 3. Artisan updates existing bid (negotiable price adjustment)
        bid_payload["proposed_price"] = 3800.0
        res_bid_update = client.post(f"/api/bookings/{booking_id}/bids", json=bid_payload, headers=headers_art)
        self.assertEqual(res_bid_update.status_code, 200)
        self.assertEqual(res_bid_update.json()["proposed_price"], 3800.0)

    def test_28b_submit_bid_without_booking_id_in_body(self):
        cust_login = client.post("/api/auth/login", json={"email": "amina@gmail.com", "password": "password123"})
        cust_token = cust_login.json()["access_token"]
        headers_cust = {"Authorization": f"Bearer {cust_token}"}

        skills = client.get("/api/skills").json()
        carp_skill = next(s for s in skills if "Carpentry" in s["name"])

        booking_payload = {
            "skill_id": carp_skill["id"],
            "title": "Custom Shelf Installation",
            "description": "Need a custom shelf mounted on a concrete wall.",
            "address": "Jos Road, Keffi",
            "emergency_level": "low",
            "budget": 5000.0
        }
        booking_res = client.post("/api/bookings", json=booking_payload, headers=headers_cust)
        booking_id = booking_res.json()["id"]

        art_login = client.post("/api/auth/login", json={"email": "chidi@woodcraft.ng", "password": "password123"})
        art_token = art_login.json()["access_token"]
        headers_art = {"Authorization": f"Bearer {art_token}"}

        bid_payload = {
            "proposed_price": 4200.0,
            "estimated_hours": 3,
            "notes": "I can supply the brackets and install it neatly."
        }
        res_bid = client.post(f"/api/bookings/{booking_id}/bids", json=bid_payload, headers=headers_art)
        self.assertEqual(res_bid.status_code, 200)
        self.assertEqual(res_bid.json()["booking_id"], booking_id)
        self.assertEqual(res_bid.json()["proposed_price"], 4200.0)

    def test_29_accept_bid_and_update_status(self):
        # Customer Zainab accepts Chidi's bid
        cust_login = client.post("/api/auth/login", json={"email": "zainab@example.com", "password": "securepassword123"})
        cust_token = cust_login.json()["access_token"]
        headers_cust = {"Authorization": f"Bearer {cust_token}"}

        bookings = client.get("/api/bookings").json()
        self.assertIsInstance(bookings, list)
        door_booking = next(b for b in bookings if "Broken Wooden Door Latch" in b["title"])
        booking_id = door_booking["id"]
        bid_id = door_booking["bids"][0]["id"]

        # Accept bid
        res_acc = client.post(f"/api/bookings/{booking_id}/accept-bid/{bid_id}", headers=headers_cust)
        self.assertEqual(res_acc.status_code, 200)
        self.assertEqual(res_acc.json()["status"], "accepted")
        self.assertEqual(res_acc.json()["agreed_price"], 3800.0)

        # Update status to in_progress then completed
        res_prog = client.put(f"/api/bookings/{booking_id}/status", json={"status": "in_progress"}, headers=headers_cust)
        self.assertEqual(res_prog.status_code, 200)

        res_comp = client.put(f"/api/bookings/{booking_id}/status", json={"status": "completed"}, headers=headers_cust)
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.json()["status"], "completed")

    # --- 7. REVIEWS & STAR RATING SYSTEM ENDPOINTS ---
    def test_30_submit_review(self):
        cust_login = client.post("/api/auth/login", json={"email": "zainab@example.com", "password": "securepassword123"})
        cust_token = cust_login.json()["access_token"]
        headers_cust = {"Authorization": f"Bearer {cust_token}"}

        bookings = client.get("/api/bookings").json()
        comp_booking = next(b for b in bookings if "Broken Wooden Door Latch" in b["title"])

        rev_payload = {
            "booking_id": comp_booking["id"],
            "rating": 5,
            "comment": "Chidi did a fantastic job installing the new door latch!"
        }
        res_rev = client.post("/api/reviews", json=rev_payload, headers=headers_cust)
        self.assertEqual(res_rev.status_code, 201)
        self.assertEqual(res_rev.json()["rating"], 5)

    def test_31_get_artisan_reviews(self):
        artisans = client.get("/api/artisans").json()
        chidi = next(a for a in artisans if "Chidi" in a["name"])

        res = client.get(f"/api/reviews/artisan/{chidi['id']}")
        self.assertEqual(res.status_code, 200)
        reviews = res.json()
        self.assertGreaterEqual(len(reviews), 1)

    def test_32_duplicate_review_fails(self):
        cust_login = client.post("/api/auth/login", json={"email": "zainab@example.com", "password": "securepassword123"})
        cust_token = cust_login.json()["access_token"]
        headers_cust = {"Authorization": f"Bearer {cust_token}"}

        bookings = client.get("/api/bookings").json()
        comp_booking = next(b for b in bookings if "Broken Wooden Door Latch" in b["title"])

        rev_payload = {
            "booking_id": comp_booking["id"],
            "rating": 4,
            "comment": "Second review attempt"
        }
        res = client.post("/api/reviews", json=rev_payload, headers=headers_cust)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already been submitted", res.json()["detail"])

    # --- 8. ADMIN DASHBOARD & AUDIT LOGS ENDPOINTS ---
    def test_33_admin_get_stats(self):
        admin_login = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/admin/stats", headers=headers)
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        self.assertGreaterEqual(stats["total_users"], 7)
        self.assertGreaterEqual(stats["total_customers"], 3)
        self.assertGreaterEqual(stats["total_artisans"], 4)

    def test_34_admin_get_audit_logs(self):
        admin_login = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/admin/audit-logs?limit=10", headers=headers)
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertGreaterEqual(len(logs), 1)

    def test_35_admin_get_all_users(self):
        admin_login = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/admin/users?role=artisan", headers=headers)
        self.assertEqual(res.status_code, 200)
        users = res.json()
        self.assertTrue(all(u["role"] == "artisan" for u in users))

    def test_36_unauthorized_role_access_fails(self):
        # Customer tries to access admin stats -> 403 Forbidden
        cust_login = client.post("/api/auth/login", json={"email": "amina@gmail.com", "password": "password123"})
        token = cust_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/admin/stats", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("does not have sufficient permissions", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
