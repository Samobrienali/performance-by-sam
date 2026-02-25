"use client";
type FormData = {
  sex: "male" | "female";
  weight: number;
  height: number;
  age: number;
  goal: "fat_loss" | "maintenance" | "muscle_gain";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
};
import { useState, useEffect, useRef } from "react";

// ─── Color & Design System ───────────────────────────────────────────────────
const TEAL = "#00B3B3";
const TEAL_DARK = "#008A8A";
const TEAL_LIGHT = "#E0F7F7";

// ─── Calorie / Macro Calculation Logic ───────────────────────────────────────
function calcBMR(
  sex: "male" | "female",
  weight: number,
  height: number,
  age: number
): number {
  if (sex === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  athlete: 1.9,
};

const GOAL_ADJUSTMENTS = {
  "fat-loss": 0.825, // ~17.5% deficit
  maintenance: 1.0,
  "muscle-gain": 1.125, // ~12.5% surplus
};

const PROTEIN_PER_KG = {
  "fat-loss": 2.2,
  maintenance: 1.8,
  "muscle-gain": 2.0,
};
function calcMacros(formData: {
  sex: "male" | "female";
  weight: number;
  height: number;
  age: number;
  goal: string;
  activity: keyof typeof ACTIVITY_MULTIPLIERS;
}): { protein: number; fat: number; carbs: number } {
  const { sex, weight, height, age, goal, activity } = formData;
  const bmr = calcBMR(sex, weight, height, age);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];


  const proteinG = Math.round(weight * PROTEIN_PER_KG[goal]);
  const fatG = Math.round(weight * 0.8);
  const proteinCals = proteinG * 4;
  const fatCals = fatG * 9;
  const carbCals = Math.max(0, targetCals - proteinCals - fatCals);
  const carbG = Math.round(carbCals / 4);

  const bmi = weight / ((height / 100) * (height / 100));
  const warnings = [];
  if (bmi < 18.5) warnings.push("BMI below 18.5 (underweight range)");
  if (bmi > 35) warnings.push("BMI above 35");
  if (targetCals < 1200) warnings.push("Calorie target below 1200 kcal");
  if (targetCals > 4500) warnings.push("Calorie target above 4500 kcal");

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCals,
    proteinG,
    fatG,
    carbG,
    warnings,
    bmi: bmi.toFixed(1),
  };
}

// ─── AI Prompt Builder ────────────────────────────────────────────────────────
function buildPrompt(formData, macros) {
  const { name, meals, dietary, allergies, budget, goal, weight, height, sex, age } = formData;
  return `You are a professional sports nutritionist. Generate a detailed 7-day meal plan for a client with these specs:

CLIENT: ${name}, ${sex}, age ${age}, ${weight}kg, ${height}cm
GOAL: ${goal}
CALORIE TARGET: ${macros.targetCals} kcal/day
MACROS: Protein ${macros.proteinG}g | Carbs ${macros.carbG}g | Fat ${macros.fatG}g
MEALS PER DAY: ${meals}
DIETARY STYLE: ${dietary}
ALLERGIES/AVOID: ${allergies || "None"}
BUDGET: ${budget}

Return ONLY valid JSON in this exact structure (no markdown, no extra text):
{
  "days": [
    {
      "day": 1,
      "dayName": "Monday",
      "totalCalories": 2100,
      "totalProtein": 175,
      "totalCarbs": 210,
      "totalFat": 65,
      "meals": [
        {
          "mealName": "Breakfast",
          "calories": 520,
          "protein": 42,
          "carbs": 55,
          "fat": 14,
          "foods": [
            { "item": "Greek Yogurt (Full Fat)", "amount": "200g" },
            { "item": "Rolled Oats", "amount": "80g" },
            { "item": "Blueberries", "amount": "100g" }
          ]
        }
      ]
    }
  ],
  "groceryList": {
    "proteins": [{ "item": "Chicken Breast", "totalAmount": "1.4kg" }],
    "carbs": [{ "item": "Rolled Oats", "totalAmount": "560g" }],
    "fats": [{ "item": "Olive Oil", "totalAmount": "120ml" }],
    "vegetables": [{ "item": "Broccoli", "totalAmount": "700g" }],
    "misc": [{ "item": "Greek Yogurt", "totalAmount": "1.4kg" }]
  }
}

RULES:
- Each day MUST total within ±5% of ${macros.targetCals} calories
- Each day MUST total within ±5% of ${macros.proteinG}g protein
- Include exactly ${meals} meals per day (label them Breakfast, Lunch, Dinner, Snack 1, Snack 2 as needed)
- Be specific with portions and realistic with ingredients
- Match the ${dietary} dietary style strictly
- Avoid: ${allergies || "nothing specific"}
- Budget level: ${budget} (${budget === "budget" ? "use affordable staple foods" : budget === "moderate" ? "mix of everyday and quality ingredients" : "high quality, premium ingredients"})
- Return ONLY the JSON object, nothing else`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #F7FAFA;
    color: #111;
    min-height: 100vh;
  }

  .heading { font-family: 'Syne', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .fade-up { animation: fadeUp 0.5s ease forwards; }
  .slide-in { animation: slideIn 0.3s ease forwards; }

  .spinner {
    width: 48px; height: 48px;
    border: 3px solid ${TEAL_LIGHT};
    border-top-color: ${TEAL};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  input, select, textarea {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #E0EBEB;
    border-radius: 10px;
    font-size: 15px;
    background: white;
    color: #111;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${TEAL};
    box-shadow: 0 0 0 3px ${TEAL}22;
  }
  input.error, select.error {
    border-color: #E53E3E;
  }

  .btn-primary {
    background: ${TEAL};
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px 32px;
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-primary:hover { background: ${TEAL_DARK}; transform: translateY(-1px); box-shadow: 0 6px 20px ${TEAL}44; }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-secondary {
    background: white;
    color: ${TEAL};
    border: 2px solid ${TEAL};
    border-radius: 10px;
    padding: 12px 28px;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: ${TEAL_LIGHT}; }

  .card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    padding: 24px;
  }

  .option-card {
    border: 2px solid #E0EBEB;
    border-radius: 12px;
    padding: 14px 18px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    text-align: left;
  }
  .option-card:hover { border-color: ${TEAL}; background: ${TEAL_LIGHT}; }
  .option-card.selected { border-color: ${TEAL}; background: ${TEAL_LIGHT}; }

  .macro-card {
    background: white;
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    border-top: 4px solid ${TEAL};
    flex: 1;
  }

  .disclaimer-box {
    background: #FFF8E1;
    border: 1.5px solid #F6C90E44;
    border-radius: 12px;
    padding: 18px 20px;
  }

  .warning-box {
    background: #FFF3F3;
    border: 1.5px solid #FC8181;
    border-radius: 12px;
    padding: 16px 18px;
  }

  .accordion-header {
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #E0EBEB;
    color: #111;
    transition: background 0.15s;
  }
  .accordion-header:hover { background: #F7FAFA; }

  .progress-bar {
    height: 4px;
    background: #E0EBEB;
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: ${TEAL};
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .section-label {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: ${TEAL};
    margin-bottom: 6px;
  }

  @media (max-width: 640px) {
    .macro-cards { flex-direction: column !important; }
    .day-meals { grid-template-columns: 1fr !important; }
  }
`;

// ─── Components ───────────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14, color: "#444" }}>
      {children} {required && <span style={{ color: TEAL }}>*</span>}
    </label>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <p style={{ color: "#E53E3E", fontSize: 12, marginTop: 4 }}>{msg}</p>;
}

function OptionCard({ label, sublabel, selected, onClick }) {
  return (
    <button className={`option-card ${selected ? "selected" : ""}`} onClick={onClick} type="button"
      style={{ width: "100%" }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: selected ? TEAL : "#111" }}>{label}</div>
      {sublabel && <div style={{ fontSize: 13, color: "#777", marginTop: 2 }}>{sublabel}</div>}
    </button>
  );
}

function StepIndicator({ step, total }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: 13, color: TEAL }}>
          Step {step} of {total}
        </span>
        <span style={{ fontSize: 13, color: "#999" }}>{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

function DisclaimerBox({ compact }) {
  const [expanded, setExpanded] = useState(!compact);
  return (
    <div className="disclaimer-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Important Disclaimer
            </div>
            {!expanded && (
              <div style={{ fontSize: 13, color: "#666" }}>
                This tool is for generally healthy adults (18–60) without diagnosed conditions. Not medical advice.
              </div>
            )}
          </div>
        </div>
        {compact && (
          <button onClick={() => setExpanded(!expanded)} type="button"
            style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 14, fontSize: 13, color: "#555", lineHeight: 1.7 }} className="slide-in">
          <p><strong>General:</strong> This nutrition plan is generated using the Mifflin-St Jeor equation and AI-generated meal planning. It is intended for generally healthy adults aged 18–60 without diagnosed metabolic or medical conditions. It is <strong>NOT medical advice</strong>.</p>

          <p style={{ marginTop: 10 }}><strong>This tool may NOT be appropriate for:</strong> Pregnant or breastfeeding women · Under 18s · Over 65s · People with eating disorders (past or present) · Diabetes (Type 1 or 2) · PCOS · Thyroid disorders · Kidney or liver disease · Competitive athletes in peak prep · Individuals on medically prescribed diets · People taking metabolism-affecting medications.</p>

          <p style={{ marginTop: 10 }}><strong>Macro & Calorie Estimates:</strong> Protein recommendations follow evidence-based ranges for general fitness populations. Calorie estimates can vary by ±10–20% due to individual metabolic differences. Higher protein intakes may not be appropriate for those with kidney conditions.</p>

          <p style={{ marginTop: 10 }}><strong>AI-Generated Content:</strong> Meal plans are generated by AI. Ingredient quantities and nutritional estimates are approximations. Verify food labels when precision is required. This tool is for educational and planning purposes only.</p>

          <p style={{ marginTop: 10 }}>Please consult a General Practitioner, Accredited Practising Dietitian, or qualified healthcare professional before making significant dietary changes.</p>
        </div>
      )}
    </div>
  );
}

function MacroBar({ label, grams, cals, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 28, color }}>
        {grams}<span style={{ fontSize: 14, fontWeight: 400, color: "#999" }}>g</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#333", marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#999" }}>{cals} kcal</div>
    </div>
  );
}

function DayAccordion({ day, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}>
      <button className="accordion-header" onClick={() => setOpen(!open)}>
        <span>Day {day.day} – {day.dayName}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#999", fontFamily: "DM Sans" }}>
            {day.totalCalories} kcal · P:{day.totalProtein}g C:{day.totalCarbs}g F:{day.totalFat}g
          </span>
          <span style={{ color: TEAL, fontSize: 18, fontFamily: "DM Sans" }}>{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "16px 20px" }} className="slide-in">
          <div className="day-meals" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {day.meals.map((meal, i) => (
              <div key={i} style={{ background: "#F7FAFA", borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 8, color: TEAL }}>
                  {meal.mealName}
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
                  {[
                    { l: "Cal", v: meal.calories },
                    { l: "P", v: `${meal.protein}g` },
                    { l: "C", v: `${meal.carbs}g` },
                    { l: "F", v: `${meal.fat}g` },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{v}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #E0EBEB", paddingTop: 8 }}>
                  {(meal.foods || []).map((f, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: "#555" }}>
                      <span>{f.item}</span>
                      <span style={{ color: "#999", marginLeft: 8, whiteSpace: "nowrap" }}>{f.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroceryList({ groceries }) {
  const sections = [
    { key: "proteins", icon: "🥩", label: "Proteins" },
    { key: "carbs", icon: "🌾", label: "Carbohydrates" },
    { key: "fats", icon: "🥑", label: "Healthy Fats" },
    { key: "vegetables", icon: "🥦", label: "Vegetables" },
    { key: "misc", icon: "🧴", label: "Miscellaneous" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
      {sections.map(({ key, icon, label }) => {
        const items = groceries?.[key] || [];
        if (!items.length) return null;
        return (
          <div key={key} className="card">
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111" }}>
              {icon} {label}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #F0F0F0", color: "#444" }}>
                <span>{it.item}</span>
                <span style={{ color: "#888", marginLeft: 8, whiteSpace: "nowrap" }}>{it.totalAmount}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0); // 0=disclaimer, 1-4=form, 5=loading, 6=results
  const [errors, setErrors] = useState({});
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [macros, setMacros] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("Calculating your macros...");
  const [apiError, setApiError] = useState(null);
  const [openMacroExplainer, setOpenMacroExplainer] = useState(false);
  const resultsRef = useRef(null);

  const [form, setForm] = useState({
    name: "", email: "", age: "", sex: "male", height: "", weight: "",
    goal: "fat-loss", activity: "moderate",
    dietary: "none", allergies: "", meals: "3", budget: "moderate",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const err = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => { const n = { ...e }; delete n[k]; return n; });

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name = "Name is required";
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Valid email required";
      if (!form.age || form.age < 18 || form.age > 60) errs.age = "Age must be 18–60";
      if (!form.height || form.height < 100 || form.height > 250) errs.height = "Height must be 100–250 cm";
      if (!form.weight || form.weight < 30 || form.weight > 300) errs.weight = "Weight must be 30–300 kg";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (step === 0 && !disclaimerChecked) return;
    if (step >= 1 && step <= 3 && !validateStep(step)) return;
    if (step === 4) { generatePlan(); return; }
    setStep(s => s + 1);
  };

  const generatePlan = async () => {
    const m = calcMacros(form);
    setMacros(m);
    setStep(5);
    setApiError(null);

    const msgs = [
      "Calculating your macros...",
      "Crafting your personalised meal plan...",
      "Selecting ingredients & portions...",
      "Building your grocery list...",
      "Finalising your 7-day plan...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 3000);

    try {
      const prompt = buildPrompt(form, m);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      clearInterval(interval);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setPlanData(parsed);
      setStep(6);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      clearInterval(interval);
      setApiError(e.message || "Failed to generate plan. Please try again.");
      setStep(4);
    }
  };

  const printPDF = () => window.print();

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      <header style={{ background: "#111", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: TEAL, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16 }}>P</span>
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "white", fontSize: 15, lineHeight: 1.2 }}>
              Performance By Sam
            </div>
            <div style={{ fontSize: 11, color: TEAL, letterSpacing: 1 }}>AI NUTRITION PLANNER</div>
          </div>
        </div>
        {step === 6 && (
          <button className="btn-primary" onClick={printPDF} style={{ padding: "8px 18px", fontSize: 13 }}>
            ↓ Download PDF
          </button>
        )}
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 80px" }}>

        {/* ── STEP 0: Disclaimer Gate ── */}
        {step === 0 && (
          <div className="fade-up">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div className="section-label">Free Tool</div>
              <h1 className="heading" style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
                Your Personalised<br />
                <span style={{ color: TEAL }}>AI Nutrition Plan</span>
              </h1>
              <p style={{ color: "#666", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
                Get your calorie target, macro breakdown, and a complete 7-day meal plan — built around your body, goal, and lifestyle.
              </p>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <DisclaimerBox compact={false} />
              <div style={{ marginTop: 20, padding: "14px 16px", background: "#F7FAFA", borderRadius: 10 }}>
                <label style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}>
                  <input type="checkbox" checked={disclaimerChecked}
                    onChange={e => setDisclaimerChecked(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: TEAL }} />
                  <span style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>
                    <strong>I confirm I am 18–60 years old</strong> and understand this is not medical advice. I agree to consult a healthcare professional if I have any existing medical conditions.
                  </span>
                </label>
              </div>
            </div>

            <button className="btn-primary" onClick={next} disabled={!disclaimerChecked}
              style={{ width: "100%", justifyContent: "center", padding: "16px" }}>
              I Understand — Build My Plan →
            </button>
          </div>
        )}

        {/* ── STEPS 1–4: Form ── */}
        {step >= 1 && step <= 4 && (
          <div className="fade-up">
            <StepIndicator step={step} total={4} />

            {step === 1 && (
              <div>
                <div className="section-label">Step 1</div>
                <h2 className="heading" style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Tell us about yourself</h2>

                <div style={{ display: "grid", gap: 16 }}>
                  {[
                    { key: "name", label: "Full Name", type: "text", placeholder: "Sam Smith" },
                    { key: "email", label: "Email Address", type: "email", placeholder: "sam@example.com" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <Label required>{label}</Label>
                      <input type={type} placeholder={placeholder} value={form[key]}
                        className={errors[key] ? "error" : ""}
                        onChange={e => { set(key, e.target.value); clearErr(key); }} />
                      <ErrorMsg msg={errors[key]} />
                    </div>
                  ))}

                  <div>
                    <Label required>Sex</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[["male", "Male ♂"], ["female", "Female ♀"]].map(([v, l]) => (
                        <OptionCard key={v} label={l} selected={form.sex === v} onClick={() => set("sex", v)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label required>Age</Label>
                    <input type="number" placeholder="e.g. 28" value={form.age} min={18} max={60}
                      className={errors.age ? "error" : ""}
                      onChange={e => { set("age", e.target.value); clearErr("age"); }} />
                    <ErrorMsg msg={errors.age} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { key: "height", label: "Height (cm)", placeholder: "175" },
                      { key: "weight", label: "Weight (kg)", placeholder: "75" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <Label required>{label}</Label>
                        <input type="number" placeholder={placeholder} value={form[key]}
                          className={errors[key] ? "error" : ""}
                          onChange={e => { set(key, e.target.value); clearErr(key); }} />
                        <ErrorMsg msg={errors[key]} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="section-label">Step 2</div>
                <h2 className="heading" style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>What's your primary goal?</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    ["fat-loss", "Fat Loss 🔥", "~17.5% calorie deficit to preserve muscle while losing fat"],
                    ["maintenance", "Maintenance ⚖️", "Eat at TDEE to sustain current body composition"],
                    ["muscle-gain", "Muscle Gain 💪", "~12.5% calorie surplus to support muscle growth"],
                  ].map(([v, l, sub]) => (
                    <OptionCard key={v} label={l} sublabel={sub} selected={form.goal === v} onClick={() => set("goal", v)} />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="section-label">Step 3</div>
                <h2 className="heading" style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Activity level</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    ["sedentary", "Sedentary 🪑", "Little or no exercise, desk job (×1.2)"],
                    ["light", "Lightly Active 🚶", "Light exercise 1–3 days/week (×1.375)"],
                    ["moderate", "Moderately Active 🏃", "Moderate exercise 3–5 days/week (×1.55)"],
                    ["very", "Very Active 🏋️", "Hard training 6–7 days/week (×1.725)"],
                    ["athlete", "Athlete ⚡", "Twice daily training, physical job (×1.9)"],
                  ].map(([v, l, sub]) => (
                    <OptionCard key={v} label={l} sublabel={sub} selected={form.activity === v} onClick={() => set("activity", v)} />
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="section-label">Step 4</div>
                <h2 className="heading" style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Preferences</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <Label>Dietary Style</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        ["none", "No preference"],
                        ["high-protein", "High Protein"],
                        ["vegetarian", "Vegetarian"],
                        ["vegan", "Vegan"],
                        ["gluten-free", "Gluten-Free"],
                      ].map(([v, l]) => (
                        <OptionCard key={v} label={l} selected={form.dietary === v} onClick={() => set("dietary", v)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Allergies / Foods to Avoid</Label>
                    <input type="text" placeholder="e.g. nuts, shellfish, lactose" value={form.allergies}
                      onChange={e => set("allergies", e.target.value)} />
                  </div>

                  <div>
                    <Label>Meals per Day</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[["3", "3 meals"], ["4", "4 meals"], ["5", "5 meals"]].map(([v, l]) => (
                        <OptionCard key={v} label={l} selected={form.meals === v} onClick={() => set("meals", v)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Budget</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        ["budget", "Budget 💰"],
                        ["moderate", "Moderate 💳"],
                        ["premium", "Premium 💎"],
                      ].map(([v, l]) => (
                        <OptionCard key={v} label={l} selected={form.budget === v} onClick={() => set("budget", v)} />
                      ))}
                    </div>
                  </div>

                  {apiError && (
                    <div className="warning-box">
                      <strong>⚠️ Error:</strong> {apiError}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              {step > 1 && (
                <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
                  ← Back
                </button>
              )}
              <button className="btn-primary" onClick={next} style={{ flex: 1, justifyContent: "center" }}>
                {step === 4 ? "Generate My Plan 🚀" : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Loading ── */}
        {step === 5 && (
          <div className="fade-up" style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <div className="spinner" />
            </div>
            <h2 className="heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, animation: "pulse 1.5s ease infinite" }}>
              {loadingMsg}
            </h2>
            <p style={{ color: "#999", fontSize: 14 }}>This takes 20–40 seconds. Please don't close this tab.</p>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {[
                "✓ Calculating BMR using Mifflin-St Jeor",
                "✓ Applying activity multiplier",
                "✓ Setting macro targets",
                "⟳ Generating personalised 7-day meal plan...",
              ].map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: i < 3 ? TEAL : "#999", display: "flex", gap: 8 }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 6: Results ── */}
        {step === 6 && macros && planData && (
          <div ref={resultsRef} className="fade-up">
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div className="section-label">Your Plan Is Ready</div>
              <h1 className="heading" style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, marginBottom: 8 }}>
                {form.name}'s Nutrition Plan
              </h1>
              <p style={{ color: "#666" }}>
                {form.goal === "fat-loss" ? "Fat Loss" : form.goal === "muscle-gain" ? "Muscle Gain" : "Maintenance"} · {
                  { sedentary: "Sedentary", light: "Lightly Active", moderate: "Moderately Active", very: "Very Active", athlete: "Athlete" }[form.activity]
                }
              </p>
            </div>

            {/* Warnings */}
            {macros.warnings.length > 0 && (
              <div className="warning-box" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Important Note</div>
                <p style={{ fontSize: 14 }}>Your results fall outside typical general fitness ranges ({macros.warnings.join(", ")}). We strongly recommend consulting a healthcare professional before following this plan.</p>
              </div>
            )}

            {/* Calorie Target */}
            <div className="card" style={{ marginBottom: 20, background: "#111", textAlign: "center" }}>
              <div style={{ color: "#999", fontSize: 13, marginBottom: 4 }}>Daily Calorie Target</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 52, color: TEAL, lineHeight: 1 }}>
                {macros.targetCals}
              </div>
              <div style={{ color: "#666", fontSize: 14 }}>kcal per day</div>
            </div>

            {/* Macros */}
            <div className="macro-cards" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div className="macro-card" style={{ borderTopColor: "#E53E3E" }}>
                <MacroBar label="Protein" grams={macros.proteinG} cals={macros.proteinG * 4} color="#E53E3E" />
              </div>
              <div className="macro-card" style={{ borderTopColor: TEAL }}>
                <MacroBar label="Carbs" grams={macros.carbG} cals={macros.carbG * 4} color={TEAL} />
              </div>
              <div className="macro-card" style={{ borderTopColor: "#ECC94B" }}>
                <MacroBar label="Fat" grams={macros.fatG} cals={macros.fatG * 9} color="#ECC94B" />
              </div>
            </div>

            {/* Macro Explainer */}
            <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
              <button className="accordion-header" onClick={() => setOpenMacroExplainer(!openMacroExplainer)}>
                📐 How Your Macros Were Calculated
                <span style={{ color: TEAL, fontSize: 18 }}>{openMacroExplainer ? "−" : "+"}</span>
              </button>
              {openMacroExplainer && (
                <div style={{ padding: "20px", fontSize: 14, lineHeight: 1.8, color: "#444" }} className="slide-in">
                  <div style={{ display: "grid", gap: 14 }}>
                    {[
                      {
                        title: "1️⃣ BMR (Basal Metabolic Rate)",
                        content: `Your BMR is the number of calories your body burns at complete rest. Using the Mifflin-St Jeor equation for ${form.sex === "male" ? "males" : "females"}: BMR = ${macros.bmr} kcal/day`
                      },
                      {
                        title: "2️⃣ TDEE (Total Daily Energy Expenditure)",
                        content: `Your BMR is multiplied by your activity level (×${ACTIVITY_MULTIPLIERS[form.activity]}) to get your total daily burn: TDEE = ${macros.tdee} kcal/day`
                      },
                      {
                        title: `3️⃣ Goal Adjustment (${form.goal === "fat-loss" ? "~17.5% deficit" : form.goal === "muscle-gain" ? "~12.5% surplus" : "No adjustment"})`,
                        content: `Your target calories are set to ${macros.targetCals} kcal/day based on your ${form.goal.replace("-", " ")} goal.`
                      },
                      {
                        title: "4️⃣ Protein Target",
                        content: `Set at ${PROTEIN_PER_KG[form.goal]}g per kg of bodyweight (${form.weight}kg × ${PROTEIN_PER_KG[form.goal]} = ${macros.proteinG}g). This is the evidence-based range for preserving/building muscle.`
                      },
                      {
                        title: "5️⃣ Fat Target",
                        content: `Set at 0.8g per kg of bodyweight (${form.weight}kg × 0.8 = ${macros.fatG}g), supporting hormonal health and satiety.`
                      },
                      {
                        title: "6️⃣ Carbohydrate Target",
                        content: `Carbs fill the remaining calorie budget after protein (${macros.proteinG * 4} kcal) and fat (${macros.fatG * 9} kcal) are accounted for. Remaining: ${macros.carbG * 4} kcal ÷ 4 = ${macros.carbG}g carbs.`
                      },
                    ].map(({ title, content }) => (
                      <div key={title} style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>
                        <div style={{ fontWeight: 700, color: "#111", marginBottom: 3 }}>{title}</div>
                        <div>{content}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: 12, background: "#F7FAFA", borderRadius: 8, fontSize: 13, color: "#888" }}>
                    ⚠️ Note: Calorie estimates can vary by ±10–20% due to individual metabolic differences. Adjust based on real-world progress over 2–4 weeks.
                  </div>
                </div>
              )}
            </div>

            {/* 7-Day Plan */}
            <h2 className="heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 14, marginTop: 32 }}>
              📅 Your 7-Day Meal Plan
            </h2>
            {(planData.days || []).map((day, i) => (
              <DayAccordion key={i} day={day} index={i} />
            ))}

            {/* Grocery List */}
            <h2 className="heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 14, marginTop: 32 }}>
              🛒 Weekly Grocery List
            </h2>
            <GroceryList groceries={planData.groceryList} />

            {/* Disclaimer (bottom) */}
            <div style={{ marginTop: 32 }}>
              <DisclaimerBox compact={true} />
            </div>

            {/* CTA */}
            <div style={{ marginTop: 32, background: "#111", borderRadius: 20, padding: "36px 28px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
              <h3 className="heading" style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
                Want This Fully Customised Weekly?
              </h3>
              <p style={{ color: "#aaa", marginBottom: 20, fontSize: 15 }}>
                Work directly with Sam for a personalised coaching plan tailored around your schedule, food preferences, and real-world results.
              </p>
              <a href="mailto:sam@performancebysam.com?subject=Coaching Enquiry"
                className="btn-primary" style={{ display: "inline-flex", textDecoration: "none", padding: "16px 32px" }}>
                Apply for Coaching →
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: "#111", color: "#555", textAlign: "center", padding: "20px 16px", fontSize: 12 }}>
        © Performance By Sam — Educational use only. Not medical advice.
        <br />
        <span style={{ color: "#333", marginTop: 4, display: "block" }}>
          Always consult a qualified healthcare professional before making significant dietary changes.
        </span>
      </footer>
    </>
  );
}
