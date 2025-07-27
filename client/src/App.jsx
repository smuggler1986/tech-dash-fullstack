import React, { useState, useEffect } from "react";

const API = "https://tech-dash-api.onrender.com";

export default function App() {
  const [page, setPage] = useState("status");
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ wip: "", reg: "", work: "", tasks: [] });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(API + "/requests")
      .then((res) => res.json())
      .then(setRequests);
  }, []);

  const saveRequest = () => {
    if (!form.wip || !form.reg || form.tasks.length === 0) return alert("All fields are required.");
    fetch(API + "/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "Pending" }),
    })
      .then((res) => res.json())
      .then((newReq) => {
        setRequests([...requests, newReq]);
        setForm({ wip: "", reg: "", work: "", tasks: [] });
        setPage("status");
      });
  };

  const deleteRequest = (id) => {
    fetch(API + "/requests/" + id, { method: "DELETE" }).then(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    });
  };

  const updateStatus = (id, updated) => {
    fetch(API + "/requests/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).then(() => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    });
  };

  const calculateStatus = (tasks) => {
    if (tasks.every((t) => t.status === "Declined")) return "Declined";
    if (tasks.some((t) => t.status === "Awaiting customer callback")) return "Awaiting customer callback";
    if (tasks.some((t) => t.status === "Authorised") && !tasks.every((t) => t.status === "Authorised")) return "Partially authorised";
    if (tasks.every((t) => t.status === "Authorised")) return "Authorised";
    return "Pending";
  };

  const approveAll = () => {
    if (!selected) return;
    const updatedTasks = selected.tasks.map((t) => ({ ...t, status: "Authorised" }));
    const status = calculateStatus(updatedTasks);
    updateStatus(selected.id, { tasks: updatedTasks, status });
    setSelected({ ...selected, tasks: updatedTasks, status });
  };

  const declineAll = () => {
    if (!selected) return;
    const updatedTasks = selected.tasks.map((t) => ({ ...t, status: "Declined" }));
    const status = calculateStatus(updatedTasks);
    updateStatus(selected.id, { tasks: updatedTasks, status });
    setSelected({ ...selected, tasks: updatedTasks, status });
  };

  const totalApproved = requests.reduce((sum, r) => {
    const taskSum = (r.tasks || []).reduce((s, t) => s + (t.status === "Authorised" ? parseFloat(t.time || 0) : 0), 0);
    return sum + taskSum;
  }, 0);

  const totalRequested = requests.reduce((sum, r) => {
    return sum + (r.tasks || []).reduce((s, t) => s + parseFloat(t.time || 0), 0);
  }, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto text-sm text-gray-800">
      {page === "status" && (
        <>
          <h1 className="text-3xl font-bold mb-2">Tech Dash</h1>
          <p className="text-gray-600 mb-4">Vehicle Repair Authorisation System</p>
          <div className="mb-2 text-sm">
            <strong>Hours Approved:</strong> {totalApproved.toFixed(1)} hrs <br />
            <strong>Hours Requested:</strong> {totalRequested.toFixed(1)} hrs
          </div>
          <table className="w-full border mb-4 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-2 text-left">WIP</th>
                <th className="py-2 px-2 text-left">Reg</th>
                <th className="py-2 px-2 text-left">Work</th>
                <th className="py-2 px-2 text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-1">{r.wip}</td>
                  <td className="px-2 py-1">{r.reg}</td>
                  <td className="px-2 py-1">{r.work}</td>
                  <td className="px-2 py-1">
      <span className={`text-white px-3 py-1 rounded-full text-xs ${
        r.status === "Authorised" ? "bg-green-500" :
        r.status === "Declined" ? "bg-red-500" :
        r.status === "Awaiting customer callback" ? "bg-yellow-400" : "bg-gray-400"
      }`}>
        {r.status}
      </span>
    </td>
                  <td className="px-2 py-1 text-right space-x-2">
                    <button onClick={() => { setSelected(r); setPage("view"); }} className="text-blue-600 hover:underline">View</button>
                    <button onClick={() => deleteRequest(r.id)} className="text-red-500 hover:underline">🛠 Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => { setForm({ wip: "", reg: "", work: "", tasks: [] }); setPage("form"); }}
            className="bg-blue-600 text-white py-2 px-4 rounded-full shadow hover:bg-blue-700"
          >
            + Add New Request
          </button>
        </>
      )}

      {page === "form" && (
        <div>
          <button className="text-blue-600 mb-4" onClick={() => setPage("status")}>← Back</button>
          <h2 className="text-xl font-semibold mb-4">Add Request</h2>
          <input
            type="number"
            placeholder="WIP Number"
            required
            value={form.wip}
            onChange={(e) => setForm({ ...form, wip: e.target.value })}
            className="block w-full border rounded px-3 py-2 mb-2"
          />
          <input
            placeholder="Registration Number"
            required
            value={form.reg}
            onChange={(e) => setForm({ ...form, reg: e.target.value })}
            className="block w-full border rounded px-3 py-2 mb-2"
          />
          <textarea
            placeholder="Fault/repair work needed"
            required
            value={form.work}
            onChange={(e) => setForm({ ...form, work: e.target.value })}
            className="block w-full border rounded px-3 py-2 mb-4"
          />
          {form.tasks.map((t, i) => (
            <div key={i} className="mb-3 border p-2 rounded">
              <input
                placeholder="Task Description"
                value={t.desc}
                onChange={(e) => {
                  const updated = [...form.tasks];
                  updated[i].desc = e.target.value;
                  setForm({ ...form, tasks: updated });
                }}
                className="block w-full border rounded px-2 py-1 mb-1"
              />
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Time (hrs)"
                value={t.time}
                onChange={(e) => {
                  const updated = [...form.tasks];
                  updated[i].time = e.target.value;
                  setForm({ ...form, tasks: updated });
                }}
                className="block w-full border rounded px-2 py-1 mb-1"
              />
              <input
                placeholder="Repair Notes (optional)"
                value={t.notes || ""}
                onChange={(e) => {
                  const updated = [...form.tasks];
                  updated[i].notes = e.target.value;
                  setForm({ ...form, tasks: updated });
                }}
                className="block w-full border rounded px-2 py-1"
              />
            </div>
          ))}
          <button onClick={() => setForm({ ...form, tasks: [...form.tasks, { desc: "", time: 0.1, notes: "", status: "Pending" }] })} className="text-blue-600 hover:underline text-sm mb-4">+ Add Task</button>
          <button
            onClick={saveRequest}
            className="block w-full bg-blue-600 text-white py-2 rounded-full font-semibold shadow hover:bg-blue-700 transition"
          >
            Submit Request
          </button>
        
          <button
            onClick={() => setPage("status")}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-full shadow hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      )}


      {page === "view" && selected && (
        <div>
          <button className="text-blue-600 mb-4" onClick={() => setPage("status")}>← Back</button>
          <h2 className="text-xl font-semibold mb-4">Review Request</h2>
          <p><strong>WIP:</strong> {selected.wip}</p>
          <p><strong>Reg:</strong> {selected.reg}</p>
          <p><strong>Work:</strong> {selected.work}</p>
          <table className="w-full text-xs border my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-1 px-2">Task</th>
                <th className="py-1 px-2">Time</th>
                <th className="py-1 px-2">Notes</th>
                <th className="py-1 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {selected.tasks.map((t, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1">{t.desc}</td>
                  <td className="px-2 py-1">{t.time}</td>
                  <td className="px-2 py-1">{t.notes}</td>
                  <td className="px-2 py-1">
                    <select
                      value={t.status}
                      onChange={(e) => {
                        const tasks = [...selected.tasks];
                        tasks[i].status = e.target.value;
                        const status = calculateStatus(tasks);
                        updateStatus(selected.id, { tasks, status });
                        setSelected({ ...selected, tasks, status });
                      }}
                    >
                      <option>Authorised</option>
                      <option>Declined</option>
                      <option>Awaiting customer callback</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2">
            <button onClick={approveAll} className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">Approve All</button>
            <button onClick={declineAll} className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">Decline All</button>
          </div>
        
          <button
            onClick={() => setPage("status")}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-full shadow hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      )}

    </div>
  );
}