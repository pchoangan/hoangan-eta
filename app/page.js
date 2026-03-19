"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Thành phần Table quản lý hiển thị và chỉnh sửa dữ liệu từ Google Sheets.
 * Lưu ý: Để tránh lỗi "Could not resolve", mã CSS được tích hợp trực tiếp 
 * vào thẻ <style> thay vì import file bên ngoài.
 */
export default function Table() {
  // Dữ liệu mặc định trong trường hợp không load được API
  const defaultData = [
    ["ID", "DATE", "NAME", "CONTENT"],
    ["1", "12/12/2006", "Nguyen Van A", "Du lieu mac dinh 1"],
    ["2", "15/05/2010", "Tran Thi B", "Du lieu mac dinh 2"]
  ];

  // --- 1. STATES ---
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  const [formData, setFormData] = useState({});
  const [indexRow, setIndexRow] = useState("");
  const [errorClick, setErrorClick] = useState("");
  const [errorRow, setErrorRow] = useState([]);

  // --- 2. EFFECTS ---
  useEffect(() => {
    const fetchData = async () => {
    const response = await fetch('/api/google-sheets');
    const dataSheet = await response.json();
    setData(dataSheet);
    setHeader(dataSheet[0]);
    setLoading(false);
  }
  fetchData(); 

    const savedErrorRow = localStorage.getItem("errorRowState");
    if (savedErrorRow) {
      try { setErrorRow(JSON.parse(savedErrorRow)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("errorRowState", JSON.stringify(errorRow));
  }, [errorRow]);

  useEffect(() => {
    if (header.length > 0) {
      const initialForm = header.reduce((acc, curr) => ({ ...acc, [curr]: "" }), { action: "" });
      setFormData(initialForm);
      setIndexRow("");
      setErrorClick("");
    }
  }, [data, header]);

  // --- 3. LOGIC ---
  const filteredData = useMemo(() => {
    if (data.length <= 1) return [];
    return data.slice(1).filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(filter.toLowerCase()))
    );
  }, [data, filter]);

  const totalPages = useMemo(() => Math.ceil(filteredData.length / rowsPerPage) || 1, [filteredData]);

  useEffect(() => { setPage(totalPages); }, [totalPages]);

  const paginationData = useMemo(() => {
    const endIndex = filteredData.length - (totalPages - page) * rowsPerPage;
    const startIndex = Math.max(0, endIndex - rowsPerPage);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, totalPages]);

  // --- 4. HANDLERS ---
  const sendFormData = async (action, row) => {
    try {
      const payload = { ...formData, action: action };
      const response = await fetch('/api/google-sheets', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        setLoading(false);
        alert(result.message);
        setErrorRow((prev) => prev.filter((r) => r[0] !== row[0]));
        if (action === "delete") {
          setData((prev) => prev.filter((r) => r[0] !== row[0]));
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Lỗi kết nối API - Dữ liệu đã được lưu tạm trong ứng dụng.");
      setLoading(false);
    }
  };

  const findRow = (row, error) => {
    const newForm = {};
    header.forEach((h, i) => { newForm[h] = row[i]; });
    setFormData(newForm);
    
    // Tăng tính chặt chẽ bằng cách so khớp cả ID (cột 0) và DATE (cột 1)
    const idx = data.findIndex((r) => r[0] === row[0] && r[1] === row[1]);
    
    setIndexRow(idx);
    setErrorClick(error);
  };

  const resetForm = () => {
    const clearedForm = header.reduce((acc, curr) => ({ ...acc, [curr]: "" }), { action: "" });
    setFormData(clearedForm);
    setIndexRow("");
  };

  const addRow = () => {
    const maxId = data.slice(1).reduce((max, row) => Math.max(max, Number(row[0]) || 0), 0);
    const newId = maxId + 1;
    const date = new Date().toLocaleString("vi-VN");
    const updatedForm = { ...formData, ID: newId, DATE: date };
    const newRowArray = header.map(h => updatedForm[h]);

    setData([...data, newRowArray]);
    setErrorRow([...errorRow, [...newRowArray, "New"]]);
    sendFormData("save", newRowArray);
    setLoading(true);
  };

  const updateRow = () => {
    if (!indexRow) return alert("Chọn hàng để cập nhật");
    const newRowArray = header.map(h => formData[h]);
    const updatedData = [...data];
    updatedData[indexRow] = newRowArray;
    setData(updatedData);
    setErrorRow([...errorRow, [...newRowArray, "Update"]]);
    sendFormData("save", newRowArray);
    setLoading(true);
  };

  const deleteRow = () => {
    if (!indexRow || !data[indexRow]) return alert("Chọn hàng để xóa");
    const rowToDelete = data[indexRow];
    setErrorRow([...errorRow, [...rowToDelete, "Delete"]]);
    sendFormData("delete", rowToDelete);
    setLoading(true);
  };

  // --- 5. RENDER ---
  return (
    <>
      <style>{`
        #table-container {
          width: 98%;
          overflow: auto;
        }
        #myTable {
          font-family: Arial, Helvetica, sans-serif;
          border-collapse: collapse;
          width: 100%;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
        }
        #myTable td,
        #myTable th {
          border: 1px solid #ddd;
          padding: 8px;
        }
        #myTable tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        #myTable tr:hover {
          background-color: #ddd;
        }
        #myTable th {
          padding-top: 12px;
          padding-bottom: 12px;
          text-align: left;
          background-color: #04aa6d;
          color: white;
          white-space: nowrap;
        }
        #myTable tr th:first-child,
        #myTable tr td:first-child {
          display: none;
        }
        .error-row {
          color: red !important;
        }
        .cell {
          height: 55px;
          overflow: hidden;
          overflow-y: auto;
        }
        .pagination-buttons button {
          margin: 5px;
          padding: 8px;
          cursor: pointer;
        }
        textarea {
          width: 100%;
          padding: 3px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: "Roboto", sans-serif;
          font-size: 16px;
          resize: vertical;
          transition: all 0.3s ease-in-out;
        }
        textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16),
            0px 3px 6px rgba(0, 0, 0, 0.23);
        }
        input[type="text"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #cccccc;
          border-radius: 4px;
          box-sizing: border-box;
          margin-bottom: 10px;
        }
        #myForm div:first-child,
        #myForm div:nth-child(2) {
          display: none;
        }
        .loading-text {
          padding: 20px;
          color: #04aa6d;
          font-weight: bold;
        }
      `}</style>

      <div id="table-container">
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Filter Table"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <table id="myTable">
          <thead>
            <tr>
              {header.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {paginationData.map((rowData) => (
              <tr
                key={rowData[0]}
                onClick={() => findRow(rowData, "")}
                className={
                  errorRow.some(err => err?.[0] === rowData[0]) || errorClick === rowData[0]
                    ? "error-row"
                    : ""
                }
              >
                {rowData.map((cell, i) => (
                  <td key={i}>
                    <div className="cell">{cell}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
        <button onClick={() => setPage(1)} disabled={page === 1}>First</button>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
        <span style={{ margin: '0 10px' }}>{page} / {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
      </div>

      {loading ? (
        <div className="loading-text">Đang tải dữ liệu...</div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {errorRow.map((row, i) => (
                <tr key={i} onClick={() => findRow(row, row[0])} className="error-row" style={{ cursor: "pointer", borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px" }}>ID: {row[0]}</td>
                  <td style={{ padding: "8px" }}>Hành động: {row[row.length - 1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {errorRow.length > 0 && (
            <button onClick={() => setErrorRow([])} style={{ margin: '10px 0' }}>ClearCatch</button>
          )}
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
        {!indexRow ? (
          <p>New ID: {data.length > 0 ? (data.slice(1).reduce((max, row) => Math.max(max, Number(row[0]) || 0), 0) + 1) : "N/A"}</p>
        ) : (
          <p>
            ID: {formData["ID"]} - DATE: {formData["DATE"]} 
            <button onClick={resetForm} style={{ marginLeft: '10px' }}>Clear</button>
          </p>
        )}

        <form id="myForm">
          {header.map((h, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <label htmlFor={h} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{h}:</label>
              <textarea
                id={h}
                name={h}
                value={formData[h] || ""}
                onChange={(e) => setFormData({ ...formData, [h]: e.target.value })}
              />
            </div>
          ))}
        </form>

        <div className="pagination-buttons" style={{ marginTop: "10px" }}>
          <button onClick={addRow} style={{ backgroundColor: '#04aa6d', color: 'white', border: 'none', borderRadius: '4px' }}>
            {!indexRow || !data[indexRow] ? "Tạo Mới" : "New copy"}
          </button>
          <button onClick={updateRow} disabled={!indexRow} style={{ backgroundColor: indexRow ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>
            Cập Nhật
          </button>
          <button onClick={deleteRow} disabled={!indexRow || !data[indexRow]} style={{ backgroundColor: (indexRow && data[indexRow]) ? '#dc3545' : '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>
            Xóa
          </button>
        </div>
      </div>
    </>
  );
}
