import { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import "./Dashboard.css"


function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");


  const colors = ["#16a34a", "#2563eb", "#dc2626", "#9333ea", "#f59e0b"];

  const getColor = (category) => {
    const index = category.length % colors.length;
    return colors[index];
  };


  const buildUrl = (customPage) => {
    let url = `${process.env.REACT_APP_API_URL}/api/transactions?page=${customPage}&limit=5`;

    if (search.trim()) url += `&search=${search}`;
    if (category !== "All") url += `&category=${category}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    return url;
  };

  const fetchTransactions = async (customPage = 1) => {
    try {
      const url = buildUrl(customPage);

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (customPage === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }

      setHasMore(customPage < data.totalPages);
      setPage(customPage);

      const params = {};
      if (search.trim()) params.search = search;
      if (category !== "All") params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.page = customPage;

      setSearchParams(params);

    } catch (error) {
      console.error("Transaction fetch failed:", error.message);
    }
  };  

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/transactions/categories`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      setCategories(data);
    } catch (error) {
      console.error("Transaction fetch failed:", error.message);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/transactions/summary`,
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      setSummary(data);
    } catch (error) {
      console.error("Transaction fetch failed:", error.message);
    }
  };

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const tokenHeader = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      const [transactionRes, summaryRes, categoryRes] = await Promise.all([
        axios.get(buildUrl(1), tokenHeader),
        axios.get(`${process.env.REACT_APP_API_URL}/api/transactions/summary`, tokenHeader),
        axios.get(`${process.env.REACT_APP_API_URL}/api/transactions/categories`, tokenHeader)
      ]);

      setTransactions(transactionRes.data.transactions);
      setHasMore(1 < transactionRes.data.totalPages);
      setPage(1);

      setSummary(summaryRes.data);
      setCategories(categoryRes.data);

    } catch (error) {
      console.error("Transaction fetch failed:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  if (loading) {
      return (
        <div className="loader">
          Loading your dashboard...
        </div>
      );
    }

  return (
    <div className="container">
      {success && <div className="success-toast">{success}</div>}

      <div className="dashboard-header">
        <h2>Welcome, {user?.name} 👋</h2>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="total-card">
          <h2>Total Expense</h2>
          <h1>₹{summary.totalExpense}</h1>
        </div>
        <h3>Category Breakdown:</h3>
        {Object.keys(summary.categoryBreakdown).length === 0 ? (
          <p className="empty-state">No data available</p>
        ) : (
          <div className="category-list">
          {Object.entries(summary.categoryBreakdown).map(([cat, amt]) => (
            <div key={cat} className="category-item">
              <span
                className="badge"
                style={{ backgroundColor: getColor(cat) }}
              >
                {cat}
              </span>
              <span className="category-amount">₹{amt}</span>
            </div>
          ))}
        </div>

        )}
      </div>

      {/* Add Transaction */}
      <div className="card">
        <h3>Add Transaction</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const newTransaction = {
              title: formData.get("title"),
              amount: Number(formData.get("amount")),
              category: formData.get("category"),
              date: formData.get("date"),
              notes: formData.get("notes")
            };

            await axios.post(
              `${process.env.REACT_APP_API_URL}/api/transactions`,
              newTransaction,
              {
                headers: { Authorization: `Bearer ${user.token}` }
              }
            );

            setSuccess("Money Added successfully 💸");

            setTimeout(() => {
              setSuccess("");
            }, 3000);

            fetchTransactions(1);
            fetchSummary();
            e.target.reset();
          }}
        >
          <input name="title" placeholder="Title" required />
          <input name="amount" type="number" placeholder="Amount" required />
          <input name="category" placeholder="Category" required />
          <input name="date" type="date" required />
          <input name="notes" placeholder="Notes" />
          <button type="submit">Add</button>
        </form>
      </div>

      {/* Filters */}
      <div className="card">
        <h3>Filters</h3>

        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            >
            <option value="All">All</option>

            {categories.map((cat) => (
                <option key={cat} value={cat}>
                {cat}
                </option>
            ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button onClick={() => fetchTransactions(1)}>
          Apply Filters
        </button>
      </div>



      {/* Transactions */}
      <div className="card">
        <h3>Recent Transactions</h3>

        {transactions.length === 0 && <p className="empty-state">No transactions found.</p>}

        {transactions.map((t) => (
          <div
            key={t._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px"
            }}
          >
            <div>
              <strong>{t.title}</strong>
              <br />
             
             <small>
              {t.category} •{" "}
              {new Date(t.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </small>

            </div>
            <div>
              <span style={{ color: "#dc2626", fontWeight: "600" }}>
                ₹{t.amount}
              </span>

              <button
                style={{
                  marginLeft: "10px",
                  backgroundColor: "#dc2626"
                }}
                onClick={async () => {
                  const confirmDelete = window.confirm(
                    "Are you sure you want to delete this transaction?"
                  );

                  if (!confirmDelete) return;

                  await axios.delete(
                    `${process.env.REACT_APP_API_URL}/api/transactions/${t._id}`,
                    {
                      headers: { Authorization: `Bearer ${user.token}` }
                    }
                  );

                  fetchTransactions(1);
                  fetchSummary();
                  }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => fetchTransactions(page + 1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>

        )}
      </div>
    </div>
  );
}

export default Dashboard;
