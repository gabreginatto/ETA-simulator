"""
Seed data for testing and demos.

Contains example jar tests and projects that are loaded on startup.
"""
from datetime import date, datetime
from typing import Dict, List, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ProjectModel, JarTestModel, JarTestCounterModel


def get_seed_jar_tests() -> List[Dict[str, Any]]:
    """Get seed jar tests data."""
    return [
        {
            "id": "JT-2024-001",
            "date": date(2024, 1, 15),
            "sample": {"source": "Primary sludge", "initial_ts_percent": 3.2},
            "polymer": {"name": "PAM-855", "type": "cationic"},
            "doses": [
                {"dose_ppm": 10.0, "cst_s": 18.0, "floc_score": 2, "supernatant_tss_mg_L": 450},
                {"dose_ppm": 15.0, "cst_s": 12.0, "floc_score": 4, "supernatant_tss_mg_L": 180},
                {"dose_ppm": 20.0, "cst_s": 13.5, "floc_score": 4, "supernatant_tss_mg_L": 150},
            ],
            "analysis": {
                "optimum_dose_ppm": 15.0,
                "acceptable_range_min_ppm": 12.0,
                "acceptable_range_max_ppm": 18.0,
            },
            "notes": "Good floc formation at 15 ppm. Slight overdosing visible at 20 ppm.",
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 15, 10, 30, 0),
        },
        {
            "id": "JT-2024-002",
            "date": date(2024, 2, 20),
            "sample": {"source": "Secondary (WAS)", "initial_ts_percent": 2.5},
            "polymer": {"name": "PAM-810", "type": "anionic"},
            "doses": [
                {"dose_ppm": 8.0, "cst_s": 22.0, "floc_score": 2, "supernatant_tss_mg_L": 380},
                {"dose_ppm": 12.0, "cst_s": 14.0, "floc_score": 4, "supernatant_tss_mg_L": 120},
                {"dose_ppm": 16.0, "cst_s": 15.5, "floc_score": 3, "supernatant_tss_mg_L": 140},
            ],
            "analysis": {
                "optimum_dose_ppm": 12.0,
                "acceptable_range_min_ppm": 10.0,
                "acceptable_range_max_ppm": 14.0,
            },
            "notes": "WAS responds well to anionic polymer. Optimum at 12 ppm.",
            "created_at": datetime(2024, 2, 20, 14, 0, 0),
            "updated_at": datetime(2024, 2, 20, 14, 0, 0),
        },
        {
            "id": "JT-2024-003",
            "date": date(2024, 3, 10),
            "sample": {"source": "Mixed (Primary + WAS)", "initial_ts_percent": 4.0},
            "polymer": {"name": "PAM-855", "type": "cationic"},
            "doses": [
                {"dose_ppm": 12.0, "cst_s": 25.0, "floc_score": 2, "supernatant_tss_mg_L": 520},
                {"dose_ppm": 18.0, "cst_s": 14.0, "floc_score": 4, "supernatant_tss_mg_L": 180},
                {"dose_ppm": 24.0, "cst_s": 15.0, "floc_score": 4, "supernatant_tss_mg_L": 160},
            ],
            "analysis": {
                "optimum_dose_ppm": 18.0,
                "acceptable_range_min_ppm": 15.0,
                "acceptable_range_max_ppm": 22.0,
            },
            "notes": "Mixed sludge requires higher dose. 18 ppm optimal.",
            "created_at": datetime(2024, 3, 10, 9, 15, 0),
            "updated_at": datetime(2024, 3, 10, 9, 15, 0),
        },
    ]


def get_seed_projects() -> List[Dict[str, Any]]:
    """Get seed projects data."""
    return [
        {
            "id": "demo-sabesp-001",
            "name": "Sabesp Demo Plant",
            "description": "Demo configuration for Sabesp presentation - 100 m³/h primary sludge",
            "plant_configuration": {
                "feed_source": {
                    "parameters": {
                        "flow_m3_h": 100.0,
                        "ts_percent": 2.8,
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
                    "polymer_price_per_kg": 5.50,
                    "operating_hours_per_day": 24.0,
                    "currency": "USD",
                },
            },
            "jar_test_id": "JT-2024-001",
            "created_at": datetime(2024, 1, 20, 8, 0, 0),
            "updated_at": datetime(2024, 1, 20, 8, 0, 0),
        },
        {
            "id": "demo-compesa-001",
            "name": "Compesa Pilot",
            "description": "Pilot plant configuration for Compesa - 50 m³/h WAS",
            "plant_configuration": {
                "feed_source": {
                    "parameters": {
                        "flow_m3_h": 50.0,
                        "ts_percent": 3.5,
                        "temperature_C": 25.0,
                    }
                },
                "polymer_conditioner": {
                    "parameters": {
                        "jar_test_optimum_ppm": 12.0,
                        "shear_factor": 1.15,
                        "safety_factor": 1.1,
                    }
                },
                "dewatering_unit": {
                    "parameters": {
                        "max_flow_m3_h": 80.0,
                        "capture_rate": 0.93,
                        "cake_dryness_percent": 21.0,
                        "polymer_split_cake": 0.25,
                    }
                },
                "settings": {
                    "polymer_price_per_kg": 4.80,
                    "operating_hours_per_day": 20.0,
                    "currency": "USD",
                },
            },
            "jar_test_id": "JT-2024-002",
            "created_at": datetime(2024, 2, 25, 10, 30, 0),
            "updated_at": datetime(2024, 2, 25, 10, 30, 0),
        },
    ]


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
            "currency": "USD",
        },
    }


async def seed_database(session: AsyncSession) -> None:
    """Seed the database with initial data if empty."""
    # Check if jar tests exist
    result = await session.execute(select(JarTestModel).limit(1))
    if result.scalar_one_or_none() is None:
        # Seed jar tests
        for jt_data in get_seed_jar_tests():
            jar_test = JarTestModel(**jt_data)
            session.add(jar_test)
        print(f"Seeded {len(get_seed_jar_tests())} jar tests")

    # Check if projects exist
    result = await session.execute(select(ProjectModel).limit(1))
    if result.scalar_one_or_none() is None:
        # Seed projects
        for proj_data in get_seed_projects():
            project = ProjectModel(**proj_data)
            session.add(project)
        print(f"Seeded {len(get_seed_projects())} projects")

    # Initialize jar test counter for current year
    year = datetime.now().year
    result = await session.execute(
        select(JarTestCounterModel).where(JarTestCounterModel.year == year)
    )
    if result.scalar_one_or_none() is None:
        # Start counter at 3 since we have seed data up to 003
        counter = JarTestCounterModel(year=year, counter=3)
        session.add(counter)

    await session.commit()
