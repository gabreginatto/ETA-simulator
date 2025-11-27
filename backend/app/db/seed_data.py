"""
Seed data for testing and demos.

Contains example jar tests and projects that are loaded on startup.
"""
from datetime import date, datetime
from typing import Dict

from app.models.jar_test import (
    JarTest,
    JarTestSample,
    JarTestPolymer,
    JarTestDose,
    JarTestAnalysis,
)
from app.models.project import Project, PlantConfiguration

# In-memory databases (will be populated from route modules)
jar_tests_db: Dict[str, JarTest] = {}
projects_db: Dict[str, Project] = {}


def create_seed_jar_tests() -> Dict[str, JarTest]:
    """Create example jar tests."""
    jar_tests = {}

    # JT-2024-001: Primary sludge, PAM-855 cationic
    jt1 = JarTest(
        id="JT-2024-001",
        date=date(2024, 1, 15),
        sample=JarTestSample(
            source="Primary sludge",
            initial_ts_percent=3.2,
        ),
        polymer=JarTestPolymer(
            name="PAM-855",
            type="cationic",
        ),
        doses=[
            JarTestDose(dose_ppm=10.0, cst_s=18.0, floc_score=2, supernatant_tss_mg_L=450),
            JarTestDose(dose_ppm=15.0, cst_s=12.0, floc_score=4, supernatant_tss_mg_L=180),
            JarTestDose(dose_ppm=20.0, cst_s=13.5, floc_score=4, supernatant_tss_mg_L=150),
        ],
        analysis=JarTestAnalysis(
            optimum_dose_ppm=15.0,
            acceptable_range_min_ppm=12.0,
            acceptable_range_max_ppm=18.0,
        ),
        notes="Good floc formation at 15 ppm. Slight overdosing visible at 20 ppm.",
        created_at=datetime(2024, 1, 15, 10, 30, 0),
        updated_at=datetime(2024, 1, 15, 10, 30, 0),
    )
    jar_tests[jt1.id] = jt1

    # JT-2024-002: Secondary sludge, PAM-810 anionic
    jt2 = JarTest(
        id="JT-2024-002",
        date=date(2024, 2, 20),
        sample=JarTestSample(
            source="Secondary (WAS)",
            initial_ts_percent=2.5,
        ),
        polymer=JarTestPolymer(
            name="PAM-810",
            type="anionic",
        ),
        doses=[
            JarTestDose(dose_ppm=8.0, cst_s=22.0, floc_score=2, supernatant_tss_mg_L=380),
            JarTestDose(dose_ppm=12.0, cst_s=14.0, floc_score=4, supernatant_tss_mg_L=120),
            JarTestDose(dose_ppm=16.0, cst_s=15.5, floc_score=3, supernatant_tss_mg_L=140),
        ],
        analysis=JarTestAnalysis(
            optimum_dose_ppm=12.0,
            acceptable_range_min_ppm=10.0,
            acceptable_range_max_ppm=14.0,
        ),
        notes="WAS responds well to anionic polymer. Optimum at 12 ppm.",
        created_at=datetime(2024, 2, 20, 14, 0, 0),
        updated_at=datetime(2024, 2, 20, 14, 0, 0),
    )
    jar_tests[jt2.id] = jt2

    # JT-2024-003: Mixed sludge, PAM-855 cationic (higher dose needed)
    jt3 = JarTest(
        id="JT-2024-003",
        date=date(2024, 3, 10),
        sample=JarTestSample(
            source="Mixed (Primary + WAS)",
            initial_ts_percent=4.0,
        ),
        polymer=JarTestPolymer(
            name="PAM-855",
            type="cationic",
        ),
        doses=[
            JarTestDose(dose_ppm=12.0, cst_s=25.0, floc_score=2, supernatant_tss_mg_L=520),
            JarTestDose(dose_ppm=18.0, cst_s=14.0, floc_score=4, supernatant_tss_mg_L=180),
            JarTestDose(dose_ppm=24.0, cst_s=15.0, floc_score=4, supernatant_tss_mg_L=160),
        ],
        analysis=JarTestAnalysis(
            optimum_dose_ppm=18.0,
            acceptable_range_min_ppm=15.0,
            acceptable_range_max_ppm=22.0,
        ),
        notes="Mixed sludge requires higher dose. 18 ppm optimal.",
        created_at=datetime(2024, 3, 10, 9, 15, 0),
        updated_at=datetime(2024, 3, 10, 9, 15, 0),
    )
    jar_tests[jt3.id] = jt3

    return jar_tests


def create_seed_projects() -> Dict[str, Project]:
    """Create example projects."""
    projects = {}

    # Sabesp Demo Plant
    p1 = Project(
        id="demo-sabesp-001",
        name="Sabesp Demo Plant",
        description="Demo configuration for Sabesp presentation - 100 m³/h primary sludge",
        plant_configuration=PlantConfiguration(
            feed_source={
                "parameters": {
                    "flow_m3_h": 100.0,
                    "ts_percent": 2.8,
                    "temperature_C": 20.0,
                }
            },
            polymer_conditioner={
                "parameters": {
                    "jar_test_optimum_ppm": 15.0,
                    "shear_factor": 1.2,
                    "safety_factor": 1.1,
                }
            },
            dewatering_unit={
                "parameters": {
                    "max_flow_m3_h": 150.0,
                    "capture_rate": 0.95,
                    "cake_dryness_percent": 23.0,
                    "polymer_split_cake": 0.3,
                }
            },
            settings={
                "polymer_price_per_kg": 5.50,
                "operating_hours_per_day": 24.0,
            },
        ),
        jar_test_id="JT-2024-001",
        created_at=datetime(2024, 1, 20, 8, 0, 0),
        updated_at=datetime(2024, 1, 20, 8, 0, 0),
    )
    projects[p1.id] = p1

    # Compesa Pilot
    p2 = Project(
        id="demo-compesa-001",
        name="Compesa Pilot",
        description="Pilot plant configuration for Compesa - 50 m³/h WAS",
        plant_configuration=PlantConfiguration(
            feed_source={
                "parameters": {
                    "flow_m3_h": 50.0,
                    "ts_percent": 3.5,
                    "temperature_C": 25.0,
                }
            },
            polymer_conditioner={
                "parameters": {
                    "jar_test_optimum_ppm": 12.0,
                    "shear_factor": 1.15,
                    "safety_factor": 1.1,
                }
            },
            dewatering_unit={
                "parameters": {
                    "max_flow_m3_h": 80.0,
                    "capture_rate": 0.93,
                    "cake_dryness_percent": 21.0,
                    "polymer_split_cake": 0.25,
                }
            },
            settings={
                "polymer_price_per_kg": 4.80,
                "operating_hours_per_day": 20.0,
            },
        ),
        jar_test_id="JT-2024-002",
        created_at=datetime(2024, 2, 25, 10, 30, 0),
        updated_at=datetime(2024, 2, 25, 10, 30, 0),
    )
    projects[p2.id] = p2

    return projects


def get_default_plant_definition() -> dict:
    """Get default plant configuration template."""
    return {
        "feed_source": {
            "parameters": {
                "flow_m3_h": 100.0,
                "ts_percent": 3.0,
                "temperature_C": 20.0,
            }
        },
        "polymer_conditioner": {
            "parameters": {
                "jar_test_optimum_ppm": 15.0,
                "shear_factor": 1.2,
                "safety_factor": 1.1,
            }
        },
        "dewatering_unit": {
            "parameters": {
                "max_flow_m3_h": 150.0,
                "capture_rate": 0.95,
                "cake_dryness_percent": 23.0,
                "polymer_split_cake": 0.3,
            }
        },
        "settings": {
            "polymer_price_per_kg": None,
            "operating_hours_per_day": 24.0,
        },
    }


def load_seed_data():
    """Load all seed data into the in-memory databases."""
    global jar_tests_db, projects_db

    # Load jar tests
    jar_tests_db.clear()
    jar_tests_db.update(create_seed_jar_tests())

    # Load projects
    projects_db.clear()
    projects_db.update(create_seed_projects())

    print(f"Loaded {len(jar_tests_db)} jar tests and {len(projects_db)} projects")


# Initialize seed data on module import
load_seed_data()
