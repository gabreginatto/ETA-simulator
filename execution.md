# SludgeSim MVP - Quick Execution Guide

## Prompt Execution Order

Execute these prompts in Claude Code in the following order. Each prompt builds on the previous ones.

### Week 1-2: Backend Foundation

```
Order | Prompt ID | Description                      | Est. Time
------|-----------|----------------------------------|----------
1     | 0.1       | Project Scaffolding              | 15 min
2     | 0.2       | Backend Dependencies             | 5 min
3     | 0.3       | Frontend Dependencies            | 5 min
4     | 1.1       | Stream Model                     | 10 min
5     | 1.2       | Feed Source Engine               | 10 min
6     | 1.3       | Polymer Conditioner Engine       | 10 min
7     | 1.4       | Dewatering Unit Engine           | 15 min
8     | 1.5       | KPI Calculations                 | 15 min
9     | 1.6       | Main Solver                      | 15 min
10    | 1.7       | JarTest Model                    | 10 min
11    | 1.8       | Project Model                    | 10 min
12    | 1.9       | API Schemas                      | 10 min
13    | 1.10      | Simulate API Route               | 10 min
14    | 1.11      | Projects API Routes              | 10 min
15    | 1.12      | JarTests API Routes              | 10 min
16    | 1.13      | FastAPI Main App                 | 10 min
17    | 1.14      | Unit Tests                       | 20 min
18    | 1.15      | Seed Data                        | 10 min
```

**Checkpoint 1**: Backend should be runnable. Test with:
```bash
cd backend && uvicorn app.main:app --reload
# Visit http://localhost:8000/docs
```

### Week 3-4: Frontend Foundation

```
Order | Prompt ID | Description                      | Est. Time
------|-----------|----------------------------------|----------
19    | 2.1       | TypeScript Types                 | 10 min
20    | 2.2       | Zustand Store                    | 15 min
21    | 2.3       | API Client                       | 10 min
22    | 2.4       | Custom Hooks                     | 15 min
23    | 2.5       | Feed Node Component              | 15 min
24    | 2.6       | Polymer Node Component           | 15 min
25    | 2.7       | Dewatering Node Component        | 15 min
26    | 2.8       | Stream Edge Component            | 10 min
27    | 2.9       | Flow Canvas Component            | 20 min
28    | 2.10      | Properties Panel                 | 20 min
29    | 2.11      | Form Components                  | 20 min
30    | 2.12      | Results Panel                    | 20 min
31    | 2.13      | Main App Layout                  | 20 min
32    | 2.14      | Simulate Button & Logic          | 10 min
33    | 2.15      | Project Save/Load UI             | 20 min
```

**Checkpoint 2**: Full app should work end-to-end:
```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload

# Terminal 2  
cd frontend && npm run dev
# Visit http://localhost:5173
```

### Week 5-6: Polish

```
Order | Prompt ID | Description                      | Est. Time
------|-----------|----------------------------------|----------
34    | 3.1       | Error Handling & Validation      | 20 min
35    | 3.2       | Warning System                   | 15 min
36    | 3.3       | Cost Model Integration           | 15 min
37    | 3.4       | Settings Panel                   | 15 min
38    | 3.5       | Responsive Design                | 30 min
39    | 3.6       | Loading States & Skeletons       | 15 min
40    | 3.7       | Keyboard Shortcuts               | 15 min
41    | 3.8       | Data Export                      | 15 min
42    | 3.9       | Demo Mode / Guided Tour          | 30 min
43    | 3.10      | Polish & Final Touches           | 30 min
```

**Checkpoint 3**: Demo-ready application

### Week 7-8: Optional Enhancements

```
Order | Prompt ID | Description                      | Est. Time
------|-----------|----------------------------------|----------
44    | 4.1       | Jar Test Dose Chart              | 20 min
45    | 4.2       | PDF Report                       | 30 min
46    | 4.3       | Multiple Equipment Prep          | 30 min
47    | 4.4       | Dark Mode                        | 20 min
48    | D.1       | Docker Setup                     | 15 min
49    | D.2       | Environment Configuration        | 10 min
50    | T.1       | Backend Integration Tests        | 30 min
51    | T.2       | Frontend Component Tests         | 30 min
```

---

## Key Technical Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| Backend | FastAPI + Pydantic v2 | Fast, modern, great typing |
| Database | SQLite (MVP) | Simple, no setup, upgrade later |
| Frontend | React 18 + TypeScript | Industry standard |
| Canvas | React Flow v12 | Best-in-class flow diagrams |
| State | Zustand | Simple, performant |
| Data Fetching | TanStack Query | Caching, mutations |
| Styling | Tailwind CSS | Rapid development |
| Components | shadcn/ui | High quality, customizable |

---

## Demo Script (Week 6)

For demoing to Sabesp/Compesa engineers:

1. **Start fresh** - Show empty project creation
2. **Configure Feed** - Enter 100 m³/h, 2.8% TS
3. **Select Jar Test** - Pick "JT-2024-001" (15 ppm optimum)
4. **Show factors** - Explain shear (1.2) and safety (1.1)
5. **Set Dewatering** - 95% capture, 23% cake DS
6. **Run Simulation** - Click Simulate
7. **Review Results**:
   - Polymer: ~20 ppm effective, X kg/tDS
   - Cake: 23% DS, Y tDS/day
   - Cost: $Z/month (if price set)
8. **Save Project** - Show persistence
9. **Modify & Re-run** - Change TS to 3.5%, re-simulate
10. **Export** - Download results

---

## File Structure Reference

```
sludge-sim/
├── backend/
│   ├── app/
│   │   ├── models/          # Stream, Equipment, JarTest, Project
│   │   ├── engine/          # Simulation logic
│   │   ├── api/             # FastAPI routes
│   │   └── db/              # Database (SQLite)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/      # React Flow nodes/edges
│   │   │   ├── panels/      # Properties, Results
│   │   │   ├── forms/       # Equipment forms
│   │   │   └── ui/          # shadcn components
│   │   ├── hooks/           # useSimulation, useProject
│   │   ├── stores/          # Zustand store
│   │   ├── api/             # API client
│   │   └── types/           # TypeScript types
│   └── ...
└── docker-compose.yml
```

---

## Tips for Claude Code

1. **Execute prompts one at a time** - Let each complete before moving on
2. **Test after checkpoints** - Verify the app works before proceeding
3. **Keep the context** - Reference previous prompts if needed
4. **Ask for fixes** - If something doesn't work, describe the error
5. **Iterate** - You can refine any prompt if the result isn't right

Good luck building SludgeSim! 🚀