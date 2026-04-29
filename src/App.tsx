import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import {
  Star,
  TrendingUp,
  HelpCircle,
  AlertTriangle,
  Home,
  Upload,
  List,
  BarChart3,
  SlidersHorizontal,
  Globe,
  Settings,
} from "lucide-react";

type MenuItem = {
  name: string;
  category: string;
  sellingPrice: number;
  recipeCost: number;
  unitsSold: number;
};

type CompanyProfile = {
  companyName: string;
  brandName: string;
  country: string;
  city: string;
  segment: string;
  cuisine: string;
  currency: string;
};

type AuthUser = {
  name: string;
  email: string;
  method: string;
};

const defaultItems: MenuItem[] = [
  { name: "Chicken Burger", category: "Main Course", sellingPrice: 28, recipeCost: 13, unitsSold: 430 },
  { name: "Truffle Pasta", category: "Main Course", sellingPrice: 55, recipeCost: 18, unitsSold: 150 },
  { name: "Saffron Dessert", category: "Dessert", sellingPrice: 32, recipeCost: 9, unitsSold: 72 },
  { name: "Arabic Coffee", category: "Beverage", sellingPrice: 18, recipeCost: 4, unitsSold: 260 },
];

const countryCities: Record<string, string[]> = {
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Khobar", "Makkah", "Madinah"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah"],
  Qatar: ["Doha"],
  Kuwait: ["Kuwait City"],
  Bahrain: ["Manama"],
  Oman: ["Muscat"],
};

const currencyByCountry: Record<string, string> = {
  "Saudi Arabia": "SAR",
  UAE: "AED",
  Qatar: "QAR",
  Kuwait: "KWD",
  Bahrain: "BHD",
  Oman: "OMR",
};

function getItems(): MenuItem[] {
  try {
    const saved = localStorage.getItem("menugear_items");
    if (!saved) return defaultItems;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultItems;
  } catch {
    return defaultItems;
  }
}

function saveItems(items: MenuItem[]) {
  localStorage.setItem("menugear_items", JSON.stringify(items));
}
function aggregateItems(items: MenuItem[]): MenuItem[] {
  const map = new Map<string, MenuItem>();

  items.forEach((item) => {
    const key = item.name.trim().toLowerCase();

    if (map.has(key)) {
      const existing = map.get(key)!;

      existing.unitsSold += item.unitsSold;

      // keep latest price and cost
      existing.sellingPrice = item.sellingPrice;
      existing.recipeCost = item.recipeCost;
    } else {
      map.set(key, { ...item });
    }
  });

  return Array.from(map.values());
}
function getUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem("menugear_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser) {
  localStorage.setItem("menugear_user", JSON.stringify(user));
}

function getCompany(): CompanyProfile | null {
  try {
    const saved = localStorage.getItem("menugear_company");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveCompany(company: CompanyProfile) {
  localStorage.setItem("menugear_company", JSON.stringify(company));
}

function metrics(item: MenuItem) {
  const revenue = item.sellingPrice * item.unitsSold;
  const totalCost = item.recipeCost * item.unitsSold;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return { revenue, totalCost, profit, margin };
}

function getAverages(items: MenuItem[]) {
  if (items.length === 0) return { avgUnits: 0, avgMargin: 0 };

  const avgUnits = items.reduce((sum, item) => sum + item.unitsSold, 0) / items.length;
  const avgMargin = items.reduce((sum, item) => sum + metrics(item).margin, 0) / items.length;

  return { avgUnits, avgMargin };
}

function classify(item: MenuItem, items: MenuItem[]) {
  const { avgUnits, avgMargin } = getAverages(items);
  const m = metrics(item);

  const highSales = item.unitsSold >= avgUnits;
  const highMargin = m.margin >= avgMargin;

  if (highSales && highMargin) return "Star";
  if (highSales && !highMargin) return "Plowhorse";
  if (!highSales && highMargin) return "Puzzle";
  return "Dog";
}

function cleanClassName(value: string) {
  if (value.includes("Star")) return "Star";
  if (value.includes("Plowhorse")) return "Plowhorse";
  if (value.includes("Puzzle")) return "Puzzle";
  return "Dog";
}

function ClassBadge({ value }: { value: string }) {
  const clean = cleanClassName(value);

  const icon =
    clean === "Star" ? (
      <Star className="w-4 h-4 text-yellow-500" />
    ) : clean === "Plowhorse" ? (
      <TrendingUp className="w-4 h-4 text-blue-500" />
    ) : clean === "Puzzle" ? (
      <HelpCircle className="w-4 h-4 text-purple-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-500" />
    );

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border text-sm font-semibold shadow-sm">
      {icon}
      {clean}
    </span>
  );
}
  function recommendation(item: MenuItem, items: MenuItem[]) {
  const itemClass = classify(item, items);
  const margin = metrics(item).margin;

  if (itemClass === "Plowhorse") {
    return "High sales but weak margin. Test a small price increase or reduce recipe cost.";
  }

  if (itemClass === "Puzzle") {
    return "Good margin but low sales. Improve photo, description, menu position, or combo offer.";
  }

  if (itemClass === "Dog") {
    return "Low sales and weak margin. Review recipe, pricing, portion size, or consider removal.";
  }

  if (margin > 65) {
    return "Strong performer. Keep visible and use it as a hero item in promotions.";
  }

  return "Stable item. Monitor weekly cost and sales trend.";
}

function aiPricingSuggestion(item: MenuItem, items: MenuItem[]) {
  const m = metrics(item);
  const itemClass = classify(item, items);

  const priceUp2 = { ...item, sellingPrice: item.sellingPrice + 2 };
  const costDown5 = { ...item, recipeCost: item.recipeCost * 0.95 };

  const marginUp = metrics(priceUp2).margin;
  const marginDown = metrics(costDown5).margin;

  if (itemClass === "Plowhorse") {
    return `AI Suggestion: Increase price by SAR 2. Margin improves from ${m.margin.toFixed(1)}% to ${marginUp.toFixed(1)}%.`;
  }

  if (itemClass === "Puzzle") {
    return `AI Suggestion: Improve visibility. If sales increase by 20%, profit increases by SAR ${(m.profit * 0.2).toFixed(0)}.`;
  }

  if (itemClass === "Dog") {
    return `AI Suggestion: Reduce cost by 5%. Margin improves from ${m.margin.toFixed(1)}% to ${marginDown.toFixed(1)}%. Consider removing item.`;
  }

  return "AI Suggestion: Maintain pricing. Use bundle strategy instead of discounting.";
}
function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm() {
    if (mode === "signup" && name.trim().length < 2) {
      alert("Please enter your name.");
      return false;
    }

    if (!email.trim()) {
      alert("Please enter your email address.");
      return false;
    }

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      alert("Please enter your password.");
      return false;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return false;
    }

    if (!/[A-Za-z]/.test(password)) {
      alert("Password must include at least one letter.");
      return false;
    }

    if (!/[0-9]/.test(password)) {
      alert("Password must include at least one number.");
      return false;
    }

    return true;
  }

  function loginWithEmail() {
    if (!validateForm()) return;

    saveUser({
      name: name || "MenuGear User",
      email,
      method: "Email",
    });

    window.location.href = "/";
  }

  function socialNotReady(method: string) {
    alert(`${method} login is not connected yet. We will connect it later using Supabase/Firebase.`);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="bg-gradient-to-br from-tealDeep to-slate-950 text-white p-8">
          <h1 className="text-4xl font-extrabold mb-4">MenuGear</h1>
          <p className="text-lg opacity-90">
            AI-powered menu engineering for GCC restaurants, cafés, cloud kitchens, and premium F&B brands.
          </p>
        </div>

        <div className="p-8">
          <h2 className="text-3xl font-extrabold text-tealDeep mb-2">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h2>

          {mode === "signup" && (
            <input
              className="border p-3 rounded-xl w-full mb-3"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            className="border p-3 rounded-xl w-full mb-3"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border p-3 rounded-xl w-full mb-4"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={loginWithEmail}
            className="bg-tealDeep text-white w-full py-3 rounded-2xl font-bold shadow mb-4"
          >
            {mode === "signin" ? "Sign In with Email" : "Sign Up with Email"}
          </button>

          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => socialNotReady("Google")} className="border py-3 rounded-2xl font-bold">
              Continue with Google
            </button>

            <button onClick={() => socialNotReady("Apple")} className="border py-3 rounded-2xl font-bold">
              Continue with Apple
            </button>

            <button onClick={() => socialNotReady("Facebook")} className="border py-3 rounded-2xl font-bold">
              Continue with Facebook
            </button>
          </div>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setName("");
              setEmail("");
              setPassword("");
            }}
            className="mt-5 text-tealDeep font-bold"
          >
            {mode === "signin" ? "New user? Create account" : "Already registered? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanySetup() {
  const user = getUser();

  const [company, setCompany] = useState<CompanyProfile>({
    companyName: "",
    brandName: "",
    country: "Saudi Arabia",
    city: "Riyadh",
    segment: "Casual Dining",
    cuisine: "International",
    currency: "SAR",
  });

  function saveSetup() {
    if (!company.companyName || !company.brandName) {
      alert("Please enter company name and brand name.");
      return;
    }

    saveCompany(company);
    window.location.href = "/";
  }

  function backToLogin() {
    localStorage.removeItem("menugear_user");
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-3xl shadow">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-tealDeep mb-2">Company Setup</h1>
            <p className="text-darkGray">
              Logged in as {user?.email}. This setup controls GCC market intelligence, currency, segment, and cuisine logic.
            </p>
          </div>

          <button onClick={backToLogin} className="border px-4 py-2 rounded-xl font-bold">
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border p-3 rounded-xl"
            placeholder="Company Name"
            value={company.companyName}
            onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
          />

          <input
            className="border p-3 rounded-xl"
            placeholder="Brand Name"
            value={company.brandName}
            onChange={(e) => setCompany({ ...company, brandName: e.target.value })}
          />

          <select
            className="border p-3 rounded-xl"
            value={company.country}
            onChange={(e) => {
              const country = e.target.value;
              setCompany({
                ...company,
                country,
                city: countryCities[country][0],
                currency: currencyByCountry[country],
              });
            }}
          >
            {Object.keys(countryCities).map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>

          <select
            className="border p-3 rounded-xl"
            value={company.city}
            onChange={(e) => setCompany({ ...company, city: e.target.value })}
          >
            {countryCities[company.country].map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>

          <select
            className="border p-3 rounded-xl"
            value={company.segment}
            onChange={(e) => setCompany({ ...company, segment: e.target.value })}
          >
            <option>Quick Service</option>
            <option>Casual Dining</option>
            <option>Premium Dining</option>
            <option>Fine Dining</option>
            <option>Café</option>
            <option>Cloud Kitchen</option>
          </select>

          <select
            className="border p-3 rounded-xl"
            value={company.cuisine}
            onChange={(e) => setCompany({ ...company, cuisine: e.target.value })}
          >
            <option>International</option>
            <option>Saudi / Khaleeji</option>
            <option>Lebanese</option>
            <option>Indian</option>
            <option>Italian</option>
            <option>American</option>
            <option>Japanese</option>
            <option>Korean</option>
            <option>Turkish</option>
            <option>Café / Dessert</option>
            <option>Fusion</option>
          </select>
        </div>

        <button onClick={saveSetup} className="mt-6 bg-tealDeep text-white px-6 py-3 rounded-2xl font-bold shadow">
          Save & Continue
        </button>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const company = getCompany();
  const user = getUser();

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-gradient-to-r from-tealDeep to-slate-950 text-white p-5 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">MenuGear</h1>
            <p className="text-xs opacity-80">
              {company ? `${company.brandName} • ${company.city} • ${company.segment}` : "AI Menu Engineering"}
            </p>
          </div>

          <div className="text-right text-xs opacity-90 hidden md:block">
            <p>{user?.name}</p>
            <p>{user?.method} login</p>
            <button
              onClick={() => {
                localStorage.removeItem("menugear_user");
                window.location.href = "/";
              }}
              className="mt-2 bg-white text-tealDeep px-3 py-1 rounded-xl font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">{children}</main>

      <nav className="fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur border rounded-3xl grid grid-cols-7 text-xs shadow-2xl overflow-hidden">
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/">Dashboard</Link>
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/upload">Upload</Link>
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/menu-items">Items</Link>
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/analytics">Matrix</Link>
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/sensitivity">
          Simulator
        </Link>
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/gcc-intelligence">
          GCC AI
        </Link>
        <Link className="p-3 text-center text-tealDeep hover:bg-slate-100" to="/settings">More</Link>
      </nav>
    </div>
  );
}

function Kpi({
  title,
  value,
  note,
  danger,
}: {
  title: string;
  value: string;
  note: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
      <p className="text-darkGray text-sm">{title}</p>
      <h3 className={`text-3xl font-extrabold ${danger ? "text-coral" : "text-tealDeep"}`}>
        {value}
      </h3>
      <p className="text-xs text-gray-500 mt-2">{note}</p>
    </div>
  );
}

function SummaryTable({ items }: { items: MenuItem[] }) {
  const cleanItems = aggregateItems(items);
  return (
    <div className="bg-white rounded-3xl shadow mt-6 overflow-x-auto">
      <div className="p-5 border-b">
        <h3 className="font-bold text-xl text-tealDeep">Menu Performance Summary</h3>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-tealDeep text-white">
          <tr>
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-left">Revenue</th>
            <th className="p-3 text-left">Cost</th>
            <th className="p-3 text-left">Profit</th>
            <th className="p-3 text-left">Margin</th>
            <th className="p-3 text-left">Class</th>
          </tr>
        </thead>

        <tbody>
          {cleanItems.map((item, index) => {
            const m = metrics(item);

            return (
              <tr key={index} className="border-b hover:bg-slate-50">
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">SAR {m.revenue.toLocaleString()}</td>
                <td className="p-3">SAR {m.totalCost.toLocaleString()}</td>
                <td className="p-3 font-semibold text-tealDeep">
                  SAR {m.profit.toLocaleString()}
                </td>
                <td className="p-3">{m.margin.toFixed(1)}%</td>
                <td className="p-3 font-semibold">
                  <ClassBadge value={classify(item, items)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  const [items, setItems] = useState<MenuItem[]>(getItems());

  useEffect(() => {
    const timer = setInterval(() => setItems(getItems()), 500);
    return () => clearInterval(timer);
  }, []);

  const totalRevenue = items.reduce((sum, item) => sum + metrics(item).revenue, 0);
  const totalCost = items.reduce((sum, item) => sum + metrics(item).totalCost, 0);
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const riskItems = items.filter((item) => metrics(item).margin < 50).length;
  const topItem = [...items].sort((a, b) => metrics(b).profit - metrics(a).profit)[0];

  return (
    <Layout>
      <h2 className="text-3xl font-extrabold text-tealDeep mb-2">
        Profitability Dashboard
      </h2>
      <p className="text-darkGray mb-5">Live financial view from menu item data</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="Total Sales" value={`SAR ${totalRevenue.toLocaleString()}`} note="Menu revenue" />
        <Kpi title="Total Cost" value={`SAR ${totalCost.toLocaleString()}`} note="Recipe cost" />
        <Kpi title="Gross Margin" value={`${margin.toFixed(1)}%`} note="Profitability" />
        <Kpi title="Risk Items" value={`${riskItems}`} note="Below 50% margin" danger />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-5 rounded-3xl shadow border-l-4 border-goldWarm">
          <h3 className="font-bold text-xl mb-2">AI Executive Insight</h3>
          <p className="text-darkGray">
            {topItem
              ? `${topItem.name} is currently the strongest profit contributor. ${recommendation(topItem, items)}`
              : "Add menu items to generate recommendations."}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <h3 className="font-bold text-xl mb-2">Action Priority</h3>
          <p className="text-darkGray">
            Start with Plowhorse and Dog items. They usually create the fastest improvement in restaurant margins.
          </p>
        </div>
      </div>

      <SummaryTable items={items} />
    </Layout>
  );
}

function MenuItems() {
  const [items, setItems] = useState<MenuItem[]>(getItems());
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    sellingPrice: "",
    recipeCost: "",
    unitsSold: "",
  });

  useEffect(() => saveItems(items), [items]);

  function addItem() {
    if (!newItem.name || !newItem.sellingPrice || !newItem.recipeCost || !newItem.unitsSold) {
      alert("Please complete item name, selling price, recipe cost, and units sold.");
      return;
    }

    setItems([
      ...items,
      {
        name: newItem.name,
        category: newItem.category || "Uncategorized",
        sellingPrice: Number(newItem.sellingPrice),
        recipeCost: Number(newItem.recipeCost),
        unitsSold: Number(newItem.unitsSold),
      },
    ]);

    setNewItem({ name: "", category: "", sellingPrice: "", recipeCost: "", unitsSold: "" });
  }

  function resetItems() {
    setItems(defaultItems);
    saveItems(defaultItems);
  }

  return (
    <Layout>
      <h2 className="text-3xl font-extrabold text-tealDeep mb-2">Menu Items</h2>
      <p className="text-darkGray mb-5">
        Add items and calculate revenue, cost, profit, margin, class, and advice.
      </p>

      <div className="bg-white p-5 rounded-3xl shadow mb-6">
        <h3 className="font-bold text-xl text-tealDeep mb-4">Add New Menu Item</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border p-3 rounded-2xl" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <input className="border p-3 rounded-2xl" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
          <input className="border p-3 rounded-2xl" placeholder="Selling price" type="number" value={newItem.sellingPrice} onChange={(e) => setNewItem({ ...newItem, sellingPrice: e.target.value })} />
          <input className="border p-3 rounded-2xl" placeholder="Recipe cost" type="number" value={newItem.recipeCost} onChange={(e) => setNewItem({ ...newItem, recipeCost: e.target.value })} />
          <input className="border p-3 rounded-2xl" placeholder="Units sold" type="number" value={newItem.unitsSold} onChange={(e) => setNewItem({ ...newItem, unitsSold: e.target.value })} />
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={addItem} className="bg-tealDeep text-white px-5 py-3 rounded-2xl font-bold shadow">
            Add Item
          </button>

          <button onClick={resetItems} className="border px-5 py-3 rounded-2xl font-bold">
            Reset Sample Data
          </button>
        </div>
      </div>

      <SummaryTable items={items} />

      <div className="bg-white rounded-3xl shadow mt-6 overflow-x-auto">
        <div className="p-5 border-b">
          <h3 className="font-bold text-xl text-tealDeep">AI Recommendations by Item</h3>
        </div>

        <table className="w-full text-sm">
          <tbody>
            {aggregateItems(items).map((item, index) => (
  <tr key={index} className="border-b">
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">
  <p>{recommendation(item, aggregateItems(items))}</p>
  <p className="text-sm text-tealDeep font-semibold mt-1">
    {aiPricingSuggestion(item, aggregateItems(items))}
  </p>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

function UploadPage() {
  const [items, setItems] = useState<MenuItem[]>(getItems());
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const [mapping, setMapping] = useState({
    name: "",
    category: "",
    sellingPrice: "",
    recipeCost: "",
    unitsSold: "",
  });

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.trim().split(/\r?\n/);

      if (lines.length < 2) {
        alert("CSV file must have headings and at least one data row.");
        return;
      }

      const detectedHeaders = lines[0].split(",").map((h) => h.trim());

      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};

        detectedHeaders.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        return row;
      });

      setHeaders(detectedHeaders);
      setCsvRows(rows);

      setMapping({
        name: detectedHeaders[0] || "",
        category: detectedHeaders[1] || "",
        sellingPrice: detectedHeaders[2] || "",
        recipeCost: detectedHeaders[3] || "",
        unitsSold: detectedHeaders[4] || "",
      });
    };

    reader.readAsText(file);
  }

  function confirmImport() {
    if (!mapping.name || !mapping.sellingPrice || !mapping.recipeCost || !mapping.unitsSold) {
      alert("Please map Item Name, Selling Price, Recipe Cost, and Units Sold.");
      return;
    }

    const importedItems: MenuItem[] = csvRows
      .map((row) => ({
        name: row[mapping.name] || "Unnamed Item",
        category: row[mapping.category] || "Uncategorized",
        sellingPrice: Number(row[mapping.sellingPrice] || 0),
        recipeCost: Number(row[mapping.recipeCost] || 0),
        unitsSold: Number(row[mapping.unitsSold] || 0),
      }))
      .filter((item) => item.name && item.sellingPrice > 0);

    const merged = [...items, ...importedItems];

    setItems(merged);
    saveItems(merged);

    alert(`${importedItems.length} items imported successfully.`);
  }

  return (
    <Layout>
      <h2 className="text-3xl font-extrabold text-tealDeep mb-2">
        CSV Upload & Heading Mapping
      </h2>

      <p className="text-darkGray mb-5">
        Upload any CSV file and map your column headings to MenuGear fields.
      </p>

      <div className="bg-white p-8 rounded-3xl shadow">
        <h3 className="font-bold text-xl mb-4">Step 1: Upload CSV</h3>

        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="border p-3 rounded-xl"
        />
      </div>

      {headers.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow mt-6">
          <h3 className="font-bold text-xl text-tealDeep mb-4">
            Step 2: Map Headings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Item Name", "name"],
              ["Category", "category"],
              ["Selling Price", "sellingPrice"],
              ["Recipe Cost", "recipeCost"],
              ["Units Sold", "unitsSold"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block text-sm font-bold mb-1">{label}</label>

                <select
                  className="border p-3 rounded-xl w-full"
                  value={(mapping as any)[key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                >
                  <option value="">Select column</option>

                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={confirmImport}
            className="mt-6 bg-tealDeep text-white px-6 py-3 rounded-2xl font-bold shadow"
          >
            Confirm Import
          </button>
        </div>
      )}

      {csvRows.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow mt-6 overflow-x-auto">
          <h3 className="font-bold text-xl text-tealDeep mb-4">
            Step 3: Preview First 5 Rows
          </h3>

          <table className="w-full text-sm">
            <thead className="bg-tealDeep text-white">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="p-3 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {csvRows.slice(0, 5).map((row, index) => (
                <tr key={index} className="border-b">
                  {headers.map((header) => (
                    <td key={header} className="p-3">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white p-5 rounded-3xl shadow mt-6">
        <h3 className="font-bold text-lg text-tealDeep mb-2">
          Sample CSV Format
        </h3>

        <pre className="bg-slate-100 p-4 rounded-xl overflow-x-auto text-sm">
Item Name,Group,Price SAR,Recipe Cost,Qty Sold{"\n"}
Chicken Pizza,Main Course,35,16,120{"\n"}
Beef Lasagna,Main Course,40,19,88
        </pre>
      </div>
    </Layout>
  );
}

function MatrixCard({
  title,
  note,
  items,
  className,
  action,
}: {
  title: string;
  note: string;
  items: MenuItem[];
  className: string;
  action: string;
}) {
  const totalRevenue = items.reduce((sum, item) => sum + metrics(item).revenue, 0);
  const avgMargin =
    items.length > 0
      ? items.reduce((sum, item) => sum + metrics(item).margin, 0) / items.length
      : 0;

  const uniqueItems = Array.from(
    new Map(items.map((item) => [item.name, item])).values()
  );

  return (
    <div className={`${className} p-6 rounded-3xl shadow border border-white/70 min-h-72`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-extrabold text-2xl">{title}</h3>
          <p className="text-sm text-slate-700 mt-1">{note}</p>
        </div>

        <div className="bg-white/80 px-4 py-2 rounded-2xl text-center shadow-sm">
          <p className="text-xs text-slate-500">Items</p>
          <p className="font-extrabold text-xl">{uniqueItems.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/80 p-3 rounded-2xl">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="font-bold">SAR {totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white/80 p-3 rounded-2xl">
          <p className="text-xs text-slate-500">Avg Margin</p>
          <p className="font-bold">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white/70 rounded-2xl p-4 mb-4">
        <p className="font-bold text-sm mb-2">Items</p>

        {uniqueItems.length ? (
          <div className="space-y-2">
            {uniqueItems.map((item, index) => {
              const m = metrics(item);

              return (
                <div
                  key={index}
                  className="flex justify-between gap-3 border-b border-slate-200 pb-2 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-bold">{m.margin.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">
                      SAR {m.profit.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No items yet</p>
        )}
      </div>

      <div className="bg-white/80 p-4 rounded-2xl border-l-4 border-slate-700">
        <p className="text-xs text-slate-500 mb-1">Recommended Action</p>
        <p className="font-semibold text-sm">{action}</p>
      </div>
    </div>
  );
}

function Analytics() {
  const [items, setItems] = useState<MenuItem[]>(aggregateItems(getItems()));

  useEffect(() => {
    const timer = setInterval(() => {
     setItems(aggregateItems(getItems()));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const groups = useMemo(
    () => ({
      star: items.filter((item) => classify(item, items).includes("Star")),
      plowhorse: items.filter((item) => classify(item, items).includes("Plowhorse")),
      puzzle: items.filter((item) => classify(item, items).includes("Puzzle")),
      dog: items.filter((item) => classify(item, items).includes("Dog")),
    }),
    [items]
  );

  const totalRevenue = items.reduce((sum, item) => sum + metrics(item).revenue, 0);
  const totalProfit = items.reduce((sum, item) => sum + metrics(item).profit, 0);
  const avgMargin =
    items.length > 0
      ? items.reduce((sum, item) => sum + metrics(item).margin, 0) / items.length
      : 0;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-tealDeep mb-2">
          Boston Matrix Executive View
        </h2>
        <p className="text-darkGray">
          Professional menu engineering analysis based on margin and popularity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            SAR {totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Total Profit</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            SAR {totalProfit.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Average Margin</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            {avgMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <MatrixCard
          title="⭐ Star"
          note="High margin + high sales"
          items={groups.star}
          className="bg-emerald-100"
          action="Protect these items. Keep them visible, promote them, and avoid unnecessary discounting."
        />

        <MatrixCard
          title="🐄 Plowhorse"
          note="Low margin + high sales"
          items={groups.plowhorse}
          className="bg-yellow-100"
          action="Improve margin through price testing, portion control, supplier negotiation, or combo redesign."
        />

        <MatrixCard
          title="❓ Puzzle"
          note="High margin + low sales"
          items={groups.puzzle}
          className="bg-blue-100"
          action="Increase visibility with better menu placement, photos, descriptions, and targeted promotions."
        />

        <MatrixCard
          title="🐶 Dog"
          note="Low margin + low sales"
          items={groups.dog}
          className="bg-red-100"
          action="Review recipe, pricing, portion size, and demand. Consider removal or full redesign."
        />
      </div>
    </Layout>
  );
}
function GCCIntelligence() {
  const company = getCompany();
  const items = aggregateItems(getItems());

  const [eventType, setEventType] = useState("Normal Week");
  const [dayType, setDayType] = useState("Weekday");

  const highMarginItems = items.filter((item) => metrics(item).margin >= 60);
  const lowMarginItems = items.filter((item) => metrics(item).margin < 50);
  const highVolumeItems = items.filter((item) => item.unitsSold >= getAverages(items).avgUnits);

  function cityInsight() {
    if (!company) return "Complete company setup to activate GCC insights.";

    if (company.city === "Riyadh") {
      return "Riyadh customers respond well to premium positioning, family dining, coffee culture, desserts, and strong delivery packaging.";
    }

    if (company.city === "Jeddah") {
      return "Jeddah has strong demand for seafood, casual dining, family platters, cafés, and relaxed dining concepts.";
    }

    if (company.city === "Dubai") {
      return "Dubai rewards strong presentation, fusion concepts, premium pricing, tourist-friendly menus, and delivery convenience.";
    }

    if (company.city === "Doha") {
      return "Doha generally supports premium café, luxury dining, family concepts, and strong hospitality-led presentation.";
    }

    return "Your city profile can be expanded with more local intelligence as market data is collected.";
  }

  function eventRecommendation() {
    if (eventType === "Ramadan") {
      return "Focus on Iftar bundles, family sharing meals, desserts, beverages, and pre-order packages. Avoid deep discounting on hero items.";
    }

    if (eventType === "Eid") {
      return "Push premium family boxes, gifting desserts, catering packs, and celebration bundles with limited-time pricing.";
    }

    if (eventType === "Saudi National Day") {
      return "Create patriotic themed bundles, limited menu items, and social-media-friendly offers. Use short campaign windows.";
    }

    if (eventType === "School Holiday") {
      return "Promote family meals, kids-friendly bundles, delivery offers, and afternoon café/dessert traffic.";
    }

    if (dayType === "Weekend") {
      return "Weekend demand usually supports bundles instead of direct discounting. Test small premium pricing on high-margin best sellers.";
    }

    return "Normal weeks are best for testing small price changes, menu placement changes, and supplier cost improvements.";
  }

  function itemSpecificSuggestion(item: MenuItem) {
    const m = metrics(item);

    if (eventType === "Ramadan" && item.category.toLowerCase().includes("dessert")) {
      return "Strong Ramadan candidate: consider dessert box, Iftar add-on, or bundle with coffee.";
    }

    if (dayType === "Weekend" && m.margin >= 60) {
      return "Weekend opportunity: protect margin and test bundle pricing instead of discounting.";
    }

    if (m.margin < 50) {
      return "Cost pressure item: negotiate supplier cost, reduce waste, adjust portion, or increase price carefully.";
    }

    if (item.unitsSold >= getAverages(items).avgUnits) {
      return "High-demand item: use as anchor item in combos and delivery campaigns.";
    }

    return "Monitor weekly trend and test better placement or description.";
  }

  return (
    <Layout>
      <h2 className="text-3xl font-extrabold text-tealDeep mb-2">
        GCC Market Intelligence
      </h2>

      <p className="text-darkGray mb-6">
        Localized F&B decision support based on country, city, segment, cuisine, event timing, and menu performance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Company Location</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            {company?.city || "Not set"}
          </p>
          <p className="text-sm text-slate-500">{company?.country}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Segment</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            {company?.segment || "Not set"}
          </p>
          <p className="text-sm text-slate-500">{company?.cuisine}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Menu Intelligence</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            {items.length} Items
          </p>
          <p className="text-sm text-slate-500">
            {highMarginItems.length} high margin items
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow mb-6">
        <h3 className="font-bold text-xl text-tealDeep mb-4">
          Scenario Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-2">Business Period</label>
            <select
              className="border p-3 rounded-xl w-full"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option>Normal Week</option>
              <option>Ramadan</option>
              <option>Eid</option>
              <option>Saudi National Day</option>
              <option>School Holiday</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">Day Type</label>
            <select
              className="border p-3 rounded-xl w-full"
              value={dayType}
              onChange={(e) => setDayType(e.target.value)}
            >
              <option>Weekday</option>
              <option>Weekend</option>
              <option>Holiday</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white p-6 rounded-3xl shadow border-l-4 border-goldWarm">
          <h3 className="font-bold text-xl mb-2">City Insight</h3>
          <p className="text-darkGray">{cityInsight()}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow border-l-4 border-tealDeep">
          <h3 className="font-bold text-xl mb-2">Event Recommendation</h3>
          <p className="text-darkGray">{eventRecommendation()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="bg-emerald-100 p-5 rounded-3xl shadow">
          <h3 className="font-extrabold text-xl mb-2">High Margin Opportunities</h3>
          {highMarginItems.length ? (
            highMarginItems.slice(0, 5).map((item) => (
              <p key={item.name} className="font-semibold">
                • {item.name} — {metrics(item).margin.toFixed(1)}%
              </p>
            ))
          ) : (
            <p>No high margin items yet.</p>
          )}
        </div>

        <div className="bg-yellow-100 p-5 rounded-3xl shadow">
          <h3 className="font-extrabold text-xl mb-2">High Volume Anchors</h3>
          {highVolumeItems.length ? (
            highVolumeItems.slice(0, 5).map((item) => (
              <p key={item.name} className="font-semibold">
                • {item.name} — {item.unitsSold} units
              </p>
            ))
          ) : (
            <p>No high volume items yet.</p>
          )}
        </div>

        <div className="bg-red-100 p-5 rounded-3xl shadow">
          <h3 className="font-extrabold text-xl mb-2">Cost Pressure Items</h3>
          {lowMarginItems.length ? (
            lowMarginItems.slice(0, 5).map((item) => (
              <p key={item.name} className="font-semibold">
                • {item.name} — {metrics(item).margin.toFixed(1)}%
              </p>
            ))
          ) : (
            <p>No major cost pressure items.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow overflow-x-auto">
        <div className="p-5 border-b">
          <h3 className="font-bold text-xl text-tealDeep">
            Item-Level GCC Suggestions
          </h3>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-tealDeep text-white">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Margin</th>
              <th className="p-3 text-left">Units</th>
              <th className="p-3 text-left">GCC Suggestion</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{metrics(item).margin.toFixed(1)}%</td>
                <td className="p-3">{item.unitsSold}</td>
                <td className="p-3">{itemSpecificSuggestion(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
function SensitivitySimulator() {
  const [items] = useState<MenuItem[]>(aggregateItems(getItems()));
  const [selectedItemName, setSelectedItemName] = useState(items[0]?.name || "");

  const [priceChange, setPriceChange] = useState(0);
  const [costChange, setCostChange] = useState(0);
  const [volumeChange, setVolumeChange] = useState(0);

  const selectedItem = items.find((item) => item.name === selectedItemName) || items[0];

  if (!selectedItem) {
    return (
      <Layout>
        <h2 className="text-3xl font-extrabold text-tealDeep mb-4">
          Sensitivity Simulator
        </h2>
        <p>No menu items available. Please add or upload items first.</p>
      </Layout>
    );
  }

  const base = metrics(selectedItem);

  const simulatedItem: MenuItem = {
    ...selectedItem,
    sellingPrice: Math.max(0, selectedItem.sellingPrice + priceChange),
    recipeCost: Math.max(0, selectedItem.recipeCost * (1 + costChange / 100)),
    unitsSold: Math.max(0, Math.round(selectedItem.unitsSold * (1 + volumeChange / 100))),
  };

  const simulated = metrics(simulatedItem);

  const profitImpact = simulated.profit - base.profit;
  const revenueImpact = simulated.revenue - base.revenue;
  const marginImpact = simulated.margin - base.margin;

  return (
    <Layout>
      <h2 className="text-3xl font-extrabold text-tealDeep mb-2">
        Sensitivity Simulator
      </h2>

      <p className="text-darkGray mb-6">
        Test how price, recipe cost, and volume changes affect revenue, profit, and margin.
      </p>

      <div className="bg-white p-6 rounded-3xl shadow mb-6">
        <label className="block font-bold mb-2">Select Menu Item</label>
        <select
          className="border p-3 rounded-xl w-full"
          value={selectedItemName}
          onChange={(e) => setSelectedItemName(e.target.value)}
        >
          {items.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="font-bold mb-2">Price Change</p>
          <p className="text-sm text-slate-500 mb-3">
            Current price: SAR {selectedItem.sellingPrice}
          </p>

          <input
            type="range"
            min="-10"
            max="20"
            value={priceChange}
            onChange={(e) => setPriceChange(Number(e.target.value))}
            className="w-full"
          />

          <p className="mt-3 font-extrabold text-tealDeep">
            {priceChange >= 0 ? "+" : ""}
            SAR {priceChange}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="font-bold mb-2">Recipe Cost Change</p>
          <p className="text-sm text-slate-500 mb-3">
            Current cost: SAR {selectedItem.recipeCost}
          </p>

          <input
            type="range"
            min="-30"
            max="30"
            value={costChange}
            onChange={(e) => setCostChange(Number(e.target.value))}
            className="w-full"
          />

          <p className="mt-3 font-extrabold text-tealDeep">
            {costChange >= 0 ? "+" : ""}
            {costChange}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="font-bold mb-2">Volume Change</p>
          <p className="text-sm text-slate-500 mb-3">
            Current units: {selectedItem.unitsSold}
          </p>

          <input
            type="range"
            min="-50"
            max="100"
            value={volumeChange}
            onChange={(e) => setVolumeChange(Number(e.target.value))}
            className="w-full"
          />

          <p className="mt-3 font-extrabold text-tealDeep">
            {volumeChange >= 0 ? "+" : ""}
            {volumeChange}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Revenue Impact</p>
          <p className="text-2xl font-extrabold text-tealDeep">
            SAR {revenueImpact.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            Base SAR {base.revenue.toLocaleString()} → Simulated SAR {simulated.revenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Profit Impact</p>
          <p className={`text-2xl font-extrabold ${profitImpact >= 0 ? "text-tealDeep" : "text-coral"}`}>
            SAR {profitImpact.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            Base SAR {base.profit.toLocaleString()} → Simulated SAR {simulated.profit.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow">
          <p className="text-sm text-slate-500">Margin Impact</p>
          <p className={`text-2xl font-extrabold ${marginImpact >= 0 ? "text-tealDeep" : "text-coral"}`}>
            {marginImpact.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">
            Base {base.margin.toFixed(1)}% → Simulated {simulated.margin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow border-l-4 border-goldWarm">
        <h3 className="font-bold text-xl mb-2">AI Scenario Comment</h3>

        <p className="text-darkGray">
          {profitImpact > 0
            ? `This scenario improves profit by SAR ${profitImpact.toLocaleString()}. Consider testing it for 7–14 days before permanent pricing changes.`
            : `This scenario reduces profit by SAR ${Math.abs(profitImpact).toLocaleString()}. Avoid this unless it is part of a short-term promotion or volume-building campaign.`}
        </p>
      </div>
    </Layout>
  );
}
function SettingsPage() {
  function resetCompany() {
    localStorage.removeItem("menugear_company");
    window.location.href = "/";
  }

  function logout() {
    localStorage.removeItem("menugear_user");
    window.location.href = "/";
  }

  return (
    <Layout>
      <h2 className="text-3xl font-extrabold text-tealDeep mb-4">Settings</h2>

      <div className="bg-white p-5 rounded-3xl shadow space-y-4">
        <p>Team, permissions, Arabic/English, billing, and integrations will be added here.</p>

        <div className="flex gap-3 flex-wrap">
          <button onClick={resetCompany} className="bg-coral text-white px-5 py-3 rounded-2xl font-bold">
            Reset Company Setup
          </button>

          <button onClick={logout} className="border px-5 py-3 rounded-2xl font-bold">
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default function App() {
  const user = getUser();
  const company = getCompany();

  return (
    <BrowserRouter>
      <Routes>
        {!user && <Route path="*" element={<AuthPage />} />}

        {user && !company && <Route path="*" element={<CompanySetup />} />}

        {user && company && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/menu-items" element={<MenuItems />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/gcc-intelligence" element={<GCCIntelligence />} />
            <Route path="/sensitivity" element={<SensitivitySimulator />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}