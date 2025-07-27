import React, { useEffect, useState } from "react";

const API = "https://tech-dash-api.onrender.com"; // Change to your Render backend URL after deploy

export default function App() {
  const [page, setPage] = useState("status");
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    wip: "",
    reg: "",
    work: "",
    overallLabour: "",
    tasks: []
  });

  useEffect(() => {
    fetch(API + "/requests")
      .then(res => res.json())
      .then(setRequests);
  }, []);

  const submitForm = (e) => {
    e.preventDefault();
    fetch(API + "/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "Pending" }),
    })
      .then(res => res.json())
      .then((newReq) => {
        setRequests([...requests, newReq]);
        setPage("status");
      });
  };

  const changeStatus = (id, status) => {
    fetch(API + "/requests/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(() => {
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
        setSelected({ ...selected, status });
      });
  };

  const totalLabour = (r) =>
    parseFloat(r.overallLabour) ||
    r.tasks?.reduce((acc, t) => acc + parseFloat(t.time || 0), 0) || 0;

  const approved = requests.filter(r => r.status === "Authorised");
  const requested = requests.filter(r => ["Pending", "Awaiting customer contact", "Declined"].includes(r.status));

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6">
        {page !== "status" && (
          <button onClick={() => setPage("status")} className="text-blue-600 text-sm mb-4">← Back</button>
        )}

        {page === "status" && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Tech Dash</h1>
            <p className="text-center text-gray-600 mb-4">Vehicle Repair Authorisation System</p>

            <div className="flex justify-between text-sm text-gray-700 mb-4">
              <div><strong>Hours approved:</strong> {approved.reduce((a, r) => a + totalLabour(r), 0).toFixed(1)} hrs</div>
              <div><strong>Hours requested:</strong> {requested.reduce((a, r) => a + totalLabour(r), 0).toFixed(1)} hrs</div>
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr><th className="p-2">WIP</th><th>Reg</th><th>Work</th><th>Status</th></tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => { setSelected(r); setPage("view"); }}>
                    <td className="p-2">{r.wip}</td>
                    <td>{r.reg}</td>
                    <td>{r.work}</td>
                    <td>
                      <span className={`text-white text-xs px-2 py-1 rounded-full ${
                        r.status === "Authorised" ? "bg-green-600" :
                        r.status === "Declined" ? "bg-red-500" :
                        r.status === "Awaiting customer contact" ? "bg-yellow-400" :
                        "bg-gray-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-center mt-6">
              <button onClick={() => { setPage("form"); setForm({ wip: "", reg: "", work: "", overallLabour: "", tasks: [] }); }} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Add New Request
              </button>
            </div>
          </>
        )}

        {page === "form" && (
          <form onSubmit={submitForm}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input required placeholder="WIP Number" value={form.wip} onChange={e => setForm({ ...form, wip: e.target.value })} className="border px-3 py-2 rounded" />
              <input required placeholder="Registration" value={form.reg} onChange={e => setForm({ ...form, reg: e.target.value })} className="border px-3 py-2 rounded" />
            </div>
            <textarea required placeholder="Work Description" value={form.work} onChange={e => setForm({ ...form, work: e.target.value })} className="w-full border px-3 py-2 rounded mb-4" rows={2} />
            <input placeholder="Overall Labour Time (hrs)" type="number" step="0.1" value={form.overallLabour} onChange={e => setForm({ ...form, overallLabour: e.target.value })} className="w-full border px-3 py-2 rounded mb-4" />

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit Request</button>
          </form>
        )}

        {page === "view" && selected && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Request Details</h2>
            <div className="mb-2"><strong>WIP:</strong> {selected.wip}</div>
            <div className="mb-2"><strong>Reg:</strong> {selected.reg}</div>
            <div className="mb-2"><strong>Work:</strong> {selected.work}</div>
            <div className="mb-2"><strong>Status:</strong> {selected.status}</div>
            <div className="mb-2"><strong>Overall Labour:</strong> {selected.overallLabour || "—"} hrs</div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Change Status</label>
              <select value={selected.status} onChange={e => changeStatus(selected.id, e.target.value)} className="border px-3 py-2 rounded w-full">
                <option>Pending</option>
                <option>Authorised</option>
                <option>Declined</option>
                <option>Awaiting customer contact</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
