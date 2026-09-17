from app.database import SessionLocal, engine, Base
from app.models import User, ArtisanProfile, Skill, AssessmentQuestion, KYCVerification, Booking, Bid, Review, AuditLog, UserRole, KYCStatus, SkillTestStatus, BookingStatus, BidStatus
from app.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@artisanhub.ng").first():
            print("Database already contains seed data.")
            return

        print("Seeding ArtisanHub database...")

        # 1. Create Skills & Assessment Questions
        skills_data = [
            {
                "name": "Plumbing & Pipefitting",
                "category": "Mechanical Services",
                "description": "Pipe repairs, water tank installations, drainage cleaning, and emergency leak fixes.",
                "questions": [
                    {
                        "text": "What is the recommended tool to tighten a loose P-trap under a sink without damaging plastic threads?",
                        "a": "Sledgehammer", "b": "Adjustable Strap Wrench / Hand tightening", "c": "Blowtorch", "d": "Chisel",
                        "correct": "B"
                    },
                    {
                        "text": "Which material is standard for modern domestic hot water supply lines in Nigeria?",
                        "a": "Lead piping", "b": "PPR (Polypropylene Random) or CPVC pipes", "c": "Cardboard tubing", "d": "Bamboo",
                        "correct": "B"
                    },
                    {
                        "text": "What is the primary function of a non-return check valve in a plumbing system?",
                        "a": "To increase water temperature", "b": "To prevent backflow of water into clean supply", "c": "To filter sand", "d": "To release excess air",
                        "correct": "B"
                    }
                ]
            },
            {
                "name": "Electrical & Wiring Repairs",
                "category": "Electrical Engineering",
                "description": "Circuit troubleshooting, distribution box setup, inverter wiring, and light fitting.",
                "questions": [
                    {
                        "text": "Before troubleshooting a shorted domestic circuit breaker, what safety action must be performed first?",
                        "a": "Pour water on the panel", "b": "Isolate the main power switch / turn off mains supply", "c": "Touch bare wires with bare hands", "d": "Increase voltage rating",
                        "correct": "B"
                    },
                    {
                        "text": "In standard single-phase wiring (UK/Nigerian code), what color corresponds to Live line?",
                        "a": "Green/Yellow", "b": "Brown or Red", "c": "Blue or Black", "d": "White",
                        "correct": "B"
                    },
                    {
                        "text": "What instrument is used to measure electrical insulation resistance?",
                        "a": "Thermometer", "b": "Megohmmeter (Megger)", "c": "Barometer", "d": "Micrometer",
                        "correct": "B"
                    }
                ]
            },
            {
                "name": "Carpentry & Furniture Fabrication",
                "category": "Woodworking",
                "description": "Door framing, roofing truss repair, custom furniture, and cabinet installation.",
                "questions": [
                    {
                        "text": "Which joint type provides superior resistance to pulling apart in drawer construction?",
                        "a": "Butt joint", "b": "Dovetail joint", "c": "Tape joint", "d": "Glue spot",
                        "correct": "B"
                    },
                    {
                        "text": "What wood treatment is commonly applied in tropical environments to prevent termite infestation?",
                        "a": "Sugar water", "b": "Anti-termite chemical / Creosote treatment", "c": "Palm oil coating", "d": "Fresh water soaking",
                        "correct": "B"
                    }
                ]
            },
            {
                "name": "HVAC & Refrigeration Mechanics",
                "category": "Cooling Systems",
                "description": "Split AC installation, refrigerant gas refilling, compressor repair, and maintenance.",
                "questions": [
                    {
                        "text": "What refrigerant gas is commonly used in modern eco-friendly residential air conditioners?",
                        "a": "R-410A / R-32", "b": "Pure Propane", "c": "Carbon Monoxide", "d": "Sulfuric Gas",
                        "correct": "A"
                    },
                    {
                        "text": "If an air conditioner evaporator coil freezes into ice, what is a likely cause?",
                        "a": "High ambient light", "b": "Low refrigerant gas leak or restricted airflow (clogged filter)", "c": "Overfilled oil", "d": "Clean fan blades",
                        "correct": "B"
                    }
                ]
            },
            {
                "name": "Masonry & Building Maintenance",
                "category": "Civil Construction",
                "description": "Blockwork, wall plastering, tiling, foundation repair, and concrete casting.",
                "questions": [
                    {
                        "text": "What standard mix ratio of Cement to Sand is typically used for interior wall plastering (rendering)?",
                        "a": "1:1", "b": "1:4 or 1:6", "c": "1:20", "d": "10:1",
                        "correct": "B"
                    }
                ]
            }
        ]

        skill_objs = []
        for sdata in skills_data:
            skill = Skill(name=sdata["name"], category=sdata["category"], description=sdata["description"])
            db.add(skill)
            db.flush()
            skill_objs.append(skill)

            for qdata in sdata["questions"]:
                q = AssessmentQuestion(
                    skill_id=skill.id,
                    question_text=qdata["text"],
                    option_a=qdata["a"],
                    option_b=qdata["b"],
                    option_c=qdata["c"],
                    option_d=qdata["d"],
                    correct_option=qdata["correct"]
                )
                db.add(q)

        # 2. Create Users
        # Admin User
        admin = User(
            name="System Administrator",
            email="admin@artisanhub.ng",
            phone="+2348000000000",
            hashed_password=get_password_hash("password123"),
            role=UserRole.ADMIN,
            location_name="Nasarawa State University, Keffi",
            latitude=8.8471,
            longitude=7.8732
        )
        db.add(admin)

        # Customer Users
        customer1 = User(
            name="Amina Lawal",
            email="amina@gmail.com",
            phone="+2348011112222",
            hashed_password=get_password_hash("password123"),
            role=UserRole.CUSTOMER,
            location_name="Highland Quarters, Keffi",
            latitude=8.8480,
            longitude=7.8740
        )
        customer2 = User(
            name="Emeka Okafor",
            email="emeka@gmail.com",
            phone="+2348033334444",
            hashed_password=get_password_hash("password123"),
            role=UserRole.CUSTOMER,
            location_name="GRA Road, Keffi",
            latitude=8.8450,
            longitude=7.8710
        )
        db.add_all([customer1, customer2])

        # Artisan Users
        artisan1 = User(
            name="Tunde Bakare",
            email="tunde@plumbing.ng",
            phone="+2348055556666",
            hashed_password=get_password_hash("password123"),
            role=UserRole.ARTISAN,
            location_name="Market Street, Keffi",
            latitude=8.8465,
            longitude=7.8725
        )
        artisan2 = User(
            name="Ibrahim Musa",
            email="ibrahim@sparks.ng",
            phone="+2348077778888",
            hashed_password=get_password_hash("password123"),
            role=UserRole.ARTISAN,
            location_name="Station Road, Keffi",
            latitude=8.8490,
            longitude=7.8750
        )
        artisan3 = User(
            name="Chidi Nnamdi",
            email="chidi@woodcraft.ng",
            phone="+2348099990000",
            hashed_password=get_password_hash("password123"),
            role=UserRole.ARTISAN,
            location_name="Angwan Lambu, Keffi",
            latitude=8.8440,
            longitude=7.8760
        )
        db.add_all([artisan1, artisan2, artisan3])
        db.flush()

        # Artisan Profiles
        prof1 = ArtisanProfile(
            user_id=artisan1.id,
            bio="Master plumber with over 8 years experience servicing residential and commercial buildings across Nasarawa.",
            trade_category="Plumbing & Pipefitting",
            hourly_rate=3000.0,
            years_experience=8,
            is_available=True,
            kyc_status=KYCStatus.APPROVED,
            skill_test_status=SkillTestStatus.PASSED,
            nin_bvn_token="NIN-22948194019",
            rating_avg=4.8,
            rating_count=12
        )
        prof2 = ArtisanProfile(
            user_id=artisan2.id,
            bio="Certified electrician specializing in rapid fault detection, solar inverter setup, and DB panel repairs.",
            trade_category="Electrical & Wiring Repairs",
            hourly_rate=3500.0,
            years_experience=6,
            is_available=True,
            kyc_status=KYCStatus.APPROVED,
            skill_test_status=SkillTestStatus.PASSED,
            nin_bvn_token="BVN-22104928104",
            rating_avg=5.0,
            rating_count=7
        )
        prof3 = ArtisanProfile(
            user_id=artisan3.id,
            bio="Expert wood craftsman for custom roofing frames, solid wood doors, and modern kitchen cabinets.",
            trade_category="Carpentry & Furniture Fabrication",
            hourly_rate=2800.0,
            years_experience=4,
            is_available=True,
            kyc_status=KYCStatus.PENDING,
            skill_test_status=SkillTestStatus.PENDING,
            nin_bvn_token="NIN-88491028471",
            rating_avg=0.0,
            rating_count=0
        )
        db.add_all([prof1, prof2, prof3])
        db.flush()

        # KYC Verification Record
        kyc1 = KYCVerification(
            artisan_id=prof1.id,
            id_type="NIN",
            id_token="NIN-22948194019",
            status=KYCStatus.APPROVED,
            notes="Identity verified via National Identity Management System query."
        )
        kyc2 = KYCVerification(
            artisan_id=prof2.id,
            id_type="BVN",
            id_token="BVN-22104928104",
            status=KYCStatus.APPROVED,
            notes="Bank verification token checked."
        )
        kyc3 = KYCVerification(
            artisan_id=prof3.id,
            id_type="NIN",
            id_token="NIN-88491028471",
            status=KYCStatus.PENDING,
            notes="Awaiting admin approval."
        )
        db.add_all([kyc1, kyc2, kyc3])

        # 3. Create Sample Booking Requests, Bids, and Completed Job with Review
        booking1 = Booking(
            customer_id=customer1.id,
            skill_id=skill_objs[0].id,  # Plumbing
            title="Burst Water Pipe under Kitchen Sink",
            description="High pressure water line split under kitchen sink flooding cabinet. Needs urgent repair within 2 hours.",
            address="Block B4, Highland Quarters, Keffi",
            latitude=8.8480,
            longitude=7.8740,
            emergency_level="emergency",
            budget=6000.0,
            agreed_price=5500.0,
            status=BookingStatus.COMPLETED
        )
        db.add(booking1)
        db.flush()

        bid1 = Bid(
            booking_id=booking1.id,
            artisan_id=artisan1.id,
            proposed_price=5500.0,
            estimated_hours=1,
            notes="I am located 5 mins away at Market Street. Can arrive with replacement PPR pipe immediately.",
            status=BidStatus.ACCEPTED
        )
        db.add(bid1)
        db.flush()

        review1 = Review(
            booking_id=booking1.id,
            customer_id=customer1.id,
            artisan_id=artisan1.id,
            rating=5,
            comment="Tunde arrived in 10 minutes and completely fixed the burst pipe! Very professional and clean work."
        )
        db.add(review1)

        # Open Booking 2
        booking2 = Booking(
            customer_id=customer2.id,
            skill_id=skill_objs[1].id,  # Electrical
            title="Short Circuit in Main Distribution Box",
            description="Tripping main breaker whenever AC is switched on. Needs diagnostic fault trace.",
            address="Plot 12, GRA Road, Keffi",
            latitude=8.8450,
            longitude=7.8710,
            emergency_level="medium",
            budget=7000.0,
            status=BookingStatus.BIDDING_OPEN
        )
        db.add(booking2)
        db.flush()

        bid2 = Bid(
            booking_id=booking2.id,
            artisan_id=artisan2.id,
            proposed_price=6500.0,
            estimated_hours=2,
            notes="I have insulation resistance testing equipment to pinpoint short circuits quickly.",
            status=BidStatus.PENDING
        )
        db.add(bid2)

        # Audit Logs
        log1 = AuditLog(user_id=admin.id, action="SYSTEM_INIT", details="Database initialized and seeded with baseline skills, accounts and test jobs.")
        db.add(log1)

        db.commit()
        print("ArtisanHub database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
