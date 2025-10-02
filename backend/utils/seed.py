from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from backend.database import MongoDatabase


async def seed_initial_data() -> None:
    db = MongoDatabase()

    # Seed users
    for username in ["Rick", "Morty"]:
        email = f"{username.lower()}@example.com"
        existing = await db.find_one("users", {"username": username})
        if not existing:
            await db.insert_one(
                "users",
                {
                    "username": username,
                    "email": email,
                    "full_name": username,
                    "is_active": True,
                },
            )

    rick = await db.find_one("users", {"username": "Rick"})
    owner_id: str = str(rick["_id"]) if rick and "_id" in rick else "seed"

    # Seed items
    items_to_seed: list[dict[str, Any]] = [
        {"slug": "plumbus", "name": "Plumbus", "title": "Plumbus", "owner_id": owner_id},
        {"slug": "gun", "name": "Portal Gun", "title": "Portal Gun", "owner_id": owner_id},
    ]

    for item in items_to_seed:
        existing_item = await db.find_one("items", {"slug": item["slug"]})
        if not existing_item:
            await db.insert_one("items", item)

    # Seed a sample project with multiple boards
    existing_project = await db.find_one("projects", {"name": "E-Commerce Platform"})
    if not existing_project:
        project_result = await db.insert_one("projects", {
            "name": "E-Commerce Platform",
            "status": "in-progress",
            "owner": {"id": owner_id, "name": "Rick"},
            "description": "Complete e-commerce platform with frontend, backend, and mobile apps",
            "stakeholders": ["Engineering Team", "Product Team", "UX Design", "QA Team"],
            "okr": {
                "objective": "Launch MVP e-commerce platform by Q2 2025",
                "keyResults": [
                    "Achieve 1000 active users in first month",
                    "Process 500 successful transactions",
                    "Maintain 99.9% uptime",
                    "Achieve < 2s average page load time"
                ]
            },
            "timelineStart": datetime.now().isoformat(),
            "timelineEnd": (datetime.now() + timedelta(days=90)).isoformat(),
            "milestones": [
                {"title": "Complete UI/UX Design", "date": (datetime.now() + timedelta(days=15)).isoformat(), "completed": True},
                {"title": "Backend API Development", "date": (datetime.now() + timedelta(days=45)).isoformat(), "completed": False},
                {"title": "Frontend Integration", "date": (datetime.now() + timedelta(days=60)).isoformat(), "completed": False},
                {"title": "QA & Testing Phase", "date": (datetime.now() + timedelta(days=75)).isoformat(), "completed": False},
                {"title": "Production Launch", "date": (datetime.now() + timedelta(days=90)).isoformat(), "completed": False}
            ],
            "risksAssumptions": [
                "Third-party payment gateway API will be stable",
                "Team size remains consistent throughout project",
                "No major scope changes during development",
                "Infrastructure costs stay within budget"
            ],
            "nextAction": "Complete authentication and authorization module",
            "blockers": [
                "Waiting for payment gateway API credentials",
                "Need final approval on checkout flow design"
            ],
            "notes": "Team is making good progress. Weekly standups on Mondays at 10am. Sprint planning every two weeks.",
            "dueDate": (datetime.now() + timedelta(days=90)).isoformat(),
        })
        project_id = str(project_result.inserted_id)
        
        # Create multiple boards for this project
        frontend_board_result = await db.insert_one("boards", {
            "name": "Frontend Development",
            "projectId": project_id,
            "description": "React/Next.js frontend development tasks"
        })
        backend_board_result = await db.insert_one("boards", {
            "name": "Backend API",
            "projectId": project_id,
            "description": "FastAPI backend and database tasks"
        })
        qa_board_result = await db.insert_one("boards", {
            "name": "QA & Testing",
            "projectId": project_id,
            "description": "Testing, QA, and bug tracking"
        })
        
        board_id = str(frontend_board_result.inserted_id)
    
    # Seed additional sample projects with different statuses
    sample_projects = [
        {
            "name": "Mobile App Redesign",
            "status": "discovery",
            "owner": {"id": owner_id, "name": "Rick"},
            "description": "Complete redesign of iOS and Android mobile applications",
            "stakeholders": ["Mobile Team", "UX Design", "Product Marketing"],
            "okr": {
                "objective": "Modernize mobile app UI/UX to increase user engagement",
                "keyResults": [
                    "Increase daily active users by 30%",
                    "Reduce app crash rate to < 0.5%",
                    "Achieve 4.5+ star rating on app stores",
                    "Decrease average session abandonment by 20%"
                ]
            },
            "timelineStart": (datetime.now() + timedelta(days=10)).isoformat(),
            "timelineEnd": (datetime.now() + timedelta(days=120)).isoformat(),
            "milestones": [
                {"title": "User Research & Discovery", "date": (datetime.now() + timedelta(days=20)).isoformat(), "completed": False},
                {"title": "Design System Creation", "date": (datetime.now() + timedelta(days=45)).isoformat(), "completed": False},
                {"title": "Prototype & User Testing", "date": (datetime.now() + timedelta(days=70)).isoformat(), "completed": False}
            ],
            "risksAssumptions": [
                "Users will adapt to new UI patterns",
                "Design system can be implemented without major technical constraints",
                "App stores will approve new version without delays"
            ],
            "nextAction": "Schedule user interviews with 20 active users",
            "blockers": [],
            "notes": "Need to align with brand guidelines team before finalizing color palette.",
            "dueDate": (datetime.now() + timedelta(days=120)).isoformat(),
        },
        {
            "name": "API Documentation Portal",
            "status": "blocked",
            "owner": {"id": owner_id, "name": "Morty"},
            "description": "Create comprehensive API documentation portal for external developers",
            "stakeholders": ["Developer Relations", "Engineering", "Technical Writing"],
            "okr": {
                "objective": "Enable external developers to integrate our API seamlessly",
                "keyResults": [
                    "Publish docs for 100% of public API endpoints",
                    "Achieve < 1 hour average time-to-first-API-call",
                    "Generate 50+ external API integrations in first quarter",
                    "Maintain 90%+ documentation accuracy score"
                ]
            },
            "timelineStart": (datetime.now() - timedelta(days=20)).isoformat(),
            "timelineEnd": (datetime.now() + timedelta(days=40)).isoformat(),
            "milestones": [
                {"title": "Choose documentation platform", "date": (datetime.now() - timedelta(days=10)).isoformat(), "completed": True},
                {"title": "Write core API docs", "date": (datetime.now() + timedelta(days=15)).isoformat(), "completed": False},
                {"title": "Add interactive examples", "date": (datetime.now() + timedelta(days=30)).isoformat(), "completed": False}
            ],
            "risksAssumptions": [
                "OpenAPI spec is complete and up-to-date",
                "Legal will approve developer terms quickly",
                "Marketing team available for portal branding"
            ],
            "nextAction": "Escalate legal approval for developer terms of service",
            "blockers": [
                "Waiting on legal team to approve developer terms of service",
                "Budget approval needed for documentation platform license"
            ],
            "notes": "Project on hold pending legal and budget approvals. Team frustrated with delays.",
            "dueDate": (datetime.now() + timedelta(days=40)).isoformat(),
        },
        {
            "name": "Internal Analytics Dashboard",
            "status": "idea",
            "owner": {"id": owner_id, "name": "Rick"},
            "description": "Build real-time analytics dashboard for business metrics and KPIs",
            "stakeholders": ["Data Team", "Executive Team", "Product Managers"],
            "okr": None,
            "timelineStart": None,
            "timelineEnd": None,
            "milestones": [],
            "risksAssumptions": [
                "Data warehouse infrastructure can handle real-time queries",
                "All teams will adopt dashboard as single source of truth"
            ],
            "nextAction": "Schedule kickoff meeting with stakeholders",
            "blockers": [],
            "notes": "Initial concept proposed in last all-hands. Need to validate requirements with stakeholders.",
            "dueDate": None,
        },
        {
            "name": "Customer Portal Migration",
            "status": "done",
            "owner": {"id": owner_id, "name": "Morty"},
            "description": "Migrate customer portal from legacy system to modern cloud infrastructure",
            "stakeholders": ["Infrastructure", "Customer Success", "Engineering"],
            "okr": {
                "objective": "Successfully migrate customer portal with zero downtime",
                "keyResults": [
                    "Migrate 100% of customer accounts",
                    "Maintain 99.99% uptime during migration",
                    "Reduce portal load time by 50%",
                    "Complete migration 2 weeks ahead of schedule"
                ]
            },
            "timelineStart": (datetime.now() - timedelta(days=90)).isoformat(),
            "timelineEnd": (datetime.now() - timedelta(days=10)).isoformat(),
            "milestones": [
                {"title": "Infrastructure Setup", "date": (datetime.now() - timedelta(days=80)).isoformat(), "completed": True},
                {"title": "Data Migration", "date": (datetime.now() - timedelta(days=50)).isoformat(), "completed": True},
                {"title": "User Acceptance Testing", "date": (datetime.now() - timedelta(days=30)).isoformat(), "completed": True},
                {"title": "Production Cutover", "date": (datetime.now() - timedelta(days=10)).isoformat(), "completed": True}
            ],
            "risksAssumptions": [],
            "nextAction": "Complete post-migration retrospective",
            "blockers": [],
            "notes": "Project completed successfully ahead of schedule! Team executed flawlessly. Customer satisfaction scores increased by 15%.",
            "dueDate": (datetime.now() - timedelta(days=10)).isoformat(),
        }
    ]
    
    for project_data in sample_projects:
        existing = await db.find_one("projects", {"name": project_data["name"]})
        if not existing:
            await db.insert_one("projects", project_data)
    
    # Use the E-Commerce Platform's frontend board for seeding columns/cards
    if existing_project:
        # Find the existing project's board
        existing_board = await db.find_one("boards", {"projectId": str(existing_project["_id"])})
        if existing_board:
            board_id = str(existing_board["_id"])
        else:
            return
    else:
        board_id = str(frontend_board_result.inserted_id)
        
        # Create columns
        col_result_1 = await db.insert_one("columns", {"boardId": board_id, "title": "To Do", "position": 0})
        col_result_2 = await db.insert_one("columns", {"boardId": board_id, "title": "In Progress", "position": 1})
        col_result_3 = await db.insert_one("columns", {"boardId": board_id, "title": "Done", "position": 2})
        
        col1_id = str(col_result_1.inserted_id)
        col2_id = str(col_result_2.inserted_id)
        col3_id = str(col_result_3.inserted_id)
        
        # Create rich sample cards
        sample_cards = [
            {
                "columnId": col1_id,
                "boardId": board_id,
                "title": "Design login page",
                "description": "Create a modern, responsive login page with email/password and OAuth support. Include forgot password flow.",
                "position": 0,
                "assignees": ["Rick", "Morty"],
                "labels": [{"name": "Design", "color": "#8B5CF6"}, {"name": "High Priority", "color": "#EF4444"}],
                "dueDate": (datetime.now() + timedelta(days=3)).isoformat(),
                "checklist": [
                    {"text": "Create wireframes", "completed": True},
                    {"text": "Design mockups", "completed": False},
                    {"text": "Get design approval", "completed": False},
                ],
                "attachmentCount": 2,
                "commentCount": 5,
            },
            {
                "columnId": col2_id,
                "boardId": board_id,
                "title": "Implement API authentication",
                "description": "Set up JWT-based authentication with refresh tokens. Include rate limiting and session management.",
                "position": 0,
                "assignees": ["Rick"],
                "labels": [{"name": "Backend", "color": "#3B82F6"}, {"name": "Security", "color": "#F59E0B"}],
                "dueDate": (datetime.now() + timedelta(days=1)).isoformat(),
                "checklist": [
                    {"text": "Setup JWT library", "completed": True},
                    {"text": "Create auth endpoints", "completed": True},
                    {"text": "Write tests", "completed": False},
                    {"text": "Deploy to staging", "completed": False},
                ],
                "attachmentCount": 1,
                "commentCount": 3,
            },
            {
                "columnId": col3_id,
                "boardId": board_id,
                "title": "Setup CI/CD pipeline",
                "description": "Configure automated testing and deployment pipeline using GitHub Actions.",
                "position": 0,
                "assignees": ["Morty"],
                "labels": [{"name": "DevOps", "color": "#10B981"}],
                "dueDate": (datetime.now() - timedelta(days=2)).isoformat(),  # Overdue
                "checklist": [
                    {"text": "Create GitHub workflow", "completed": True},
                    {"text": "Configure test environment", "completed": True},
                    {"text": "Setup production deployment", "completed": True},
                ],
                "attachmentCount": 0,
                "commentCount": 8,
            },
        ]
        
        for card in sample_cards:
            await db.insert_one("cards", card)


