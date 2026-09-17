import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine, Base
from app.seed import seed_database

client = TestClient(app)

class TestArtisanHubAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure database is seeded
        seed_database()

    def test_01_health_check(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

        res_health = client.get("/api/health")
        self.assertEqual(res_health.status_code, 200)

    def test_02_authentication(self):
        # 1. Login Customer
        res = client.post("/api/auth/login", json={"email": "amina@gmail.com", "password": "password123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "customer")
        customer_token = data["access_token"]

        # Get me
        headers = {"Authorization": f"Bearer {customer_token}"}
        me_res = client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["name"], "Amina Lawal")

        # 2. Login Admin
        admin_res = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        self.assertEqual(admin_res.status_code, 200)
        self.assertEqual(admin_res.json()["role"], "admin")

    def test_03_artisan_directory_and_filter(self):
        res = client.get("/api/artisans")
        self.assertEqual(res.status_code, 200)
        artisans = res.json()
        self.assertGreaterEqual(len(artisans), 3)

        # Filter by Plumbing
        res_plumb = client.get("/api/artisans?trade_category=Plumbing")
        self.assertEqual(res_plumb.status_code, 200)
        self.assertTrue(any("Plumbing" in a["artisan_profile"]["trade_category"] for a in res_plumb.json()))

        # Filter verified only
        res_ver = client.get("/api/artisans?verified_only=true")
        self.assertEqual(res_ver.status_code, 200)
        for a in res_ver.json():
            self.assertEqual(a["artisan_profile"]["kyc_status"], "approved")
            self.assertEqual(a["artisan_profile"]["skill_test_status"], "passed")

    def test_04_skills_and_assessment_quiz(self):
        res_skills = client.get("/api/skills")
        self.assertEqual(res_skills.status_code, 200)
        skills = res_skills.json()
        self.assertGreaterEqual(len(skills), 5)

        # Login Artisan 3 (Chidi Nnamdi - Carpentry)
        login_res = client.post("/api/auth/login", json={"email": "chidi@woodcraft.ng", "password": "password123"})
        artisan_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {artisan_token}"}

        # Find Carpentry skill
        carpentry_skill = next(s for s in skills if "Carpentry" in s["name"])
        questions = carpentry_skill["questions"]

        # Submit Quiz with 100% correct answers
        quiz_payload = {
            "skill_id": carpentry_skill["id"],
            "answers": [
                {"question_id": questions[0]["id"], "selected_option": "B"},
                {"question_id": questions[1]["id"], "selected_option": "B"}
            ]
        }
        res_quiz = client.post("/api/skills/submit-quiz", json=quiz_payload, headers=headers)
        self.assertEqual(res_quiz.status_code, 200)
        result = res_quiz.json()
        self.assertTrue(result["passed"])
        self.assertEqual(result["skill_test_status"], "passed")

    def test_05_kyc_verification_gate(self):
        # Login Artisan 3
        login_res = client.post("/api/auth/login", json={"email": "chidi@woodcraft.ng", "password": "password123"})
        artisan_token = login_res.json()["access_token"]
        headers_artisan = {"Authorization": f"Bearer {artisan_token}"}

        # Submit KYC NIN token
        kyc_payload = {"id_type": "NIN", "id_token": "NIN-990011223344"}
        res_kyc = client.post("/api/kyc/submit", json=kyc_payload, headers=headers_artisan)
        self.assertEqual(res_kyc.status_code, 200)
        kyc_id = res_kyc.json()["id"]

        # Login Admin
        admin_login = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        admin_token = admin_login.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        # Admin Approve KYC
        res_approve = client.post(f"/api/kyc/approve/{kyc_id}", json={"approved": True, "notes": "NIN verified."}, headers=headers_admin)
        self.assertEqual(res_approve.status_code, 200)
        self.assertEqual(res_approve.json()["status"], "approved")

    def test_06_booking_bidding_review_flow(self):
        # 1. Customer Emeka creates booking request
        cust_login = client.post("/api/auth/login", json={"email": "emeka@gmail.com", "password": "password123"})
        cust_token = cust_login.json()["access_token"]
        headers_cust = {"Authorization": f"Bearer {cust_token}"}

        skills = client.get("/api/skills").json()
        plumbing_skill = next(s for s in skills if "Plumbing" in s["name"])

        booking_payload = {
            "skill_id": plumbing_skill["id"],
            "title": "Leaking Outdoor Tap",
            "description": "Garden pipe connector tap leaking heavily.",
            "address": "GRA Keffi",
            "emergency_level": "medium",
            "budget": 4000.0
        }
        res_book = client.post("/api/bookings", json=booking_payload, headers=headers_cust)
        self.assertEqual(res_book.status_code, 201)
        booking_id = res_book.json()["id"]

        # 2. Artisan Tunde submits bid
        art_login = client.post("/api/auth/login", json={"email": "tunde@plumbing.ng", "password": "password123"})
        art_token = art_login.json()["access_token"]
        headers_art = {"Authorization": f"Bearer {art_token}"}

        bid_payload = {
            "booking_id": booking_id,
            "proposed_price": 3800.0,
            "estimated_hours": 1,
            "notes": "I can supply high quality brass tap connector."
        }
        res_bid = client.post(f"/api/bookings/{booking_id}/bids", json=bid_payload, headers=headers_art)
        self.assertEqual(res_bid.status_code, 200)
        bid_id = res_bid.json()["id"]

        # 3. Customer Emeka accepts bid
        res_accept = client.post(f"/api/bookings/{booking_id}/accept-bid/{bid_id}", headers=headers_cust)
        self.assertEqual(res_accept.status_code, 200)
        self.assertEqual(res_accept.json()["status"], "accepted")

        # 4. Complete job
        res_status = client.put(f"/api/bookings/{booking_id}/status", json={"status": "completed"}, headers=headers_cust)
        self.assertEqual(res_status.status_code, 200)

        # 5. Customer submits review
        review_payload = {
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Quick fix and neat work!"
        }
        res_rev = client.post("/api/reviews", json=review_payload, headers=headers_cust)
        self.assertEqual(res_rev.status_code, 201)
        self.assertEqual(res_rev.json()["rating"], 5)

    def test_07_admin_dashboard_and_audit(self):
        admin_login = client.post("/api/auth/login", json={"email": "admin@artisanhub.ng", "password": "password123"})
        admin_token = admin_login.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        # Dashboard stats
        res_stats = client.get("/api/admin/stats", headers=headers_admin)
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.json()
        self.assertGreaterEqual(stats["total_users"], 6)
        self.assertGreaterEqual(stats["verified_artisans"], 2)

        # Audit logs
        res_logs = client.get("/api/admin/audit-logs", headers=headers_admin)
        self.assertEqual(res_logs.status_code, 200)
        self.assertGreaterEqual(len(res_logs.json()), 1)

if __name__ == "__main__":
    unittest.main()
