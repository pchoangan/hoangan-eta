"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Thành phần Table quản lý hiển thị và chỉnh sửa dữ liệu từ Google Sheets.
 * Cải tiến: Hỗ trợ radio và checkbox dựa trên định nghĩa ở dòng thứ 2.
 */
export default function Table() {
  // Dữ liệu mặc định minh họa cho radio và checkbox
  const defaultData = [
    ["ID", "DATE", "NAME", "GENDER", "HOBBIES", "CONTENT"],
    ["number", "date", "text", "radio:Nam,Nữ", "checkbox:Đọc sách,Du lịch,Thể thao", "textarea"], 
    ["1", "2024-03-19", "Nguyen Van A", "Nam", "Đọc sách,Thể thao", "Ghi chú mẫu 1"],
    ["2", "2024-03-20", "Tran Thi B", "Nữ", "Du lịch", "Ghi chú mẫu 2"]
  ];

  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [inputTypes, setInputTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  const [formData, setFormData] = useState({});
  const [indexRow, setIndexRow] = useState("");
  const [errorClick, setErrorClick] = useState("");
  const [errorRow, setErrorRow] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/google-sheets');
        const dataSheet = response.ok ? await response.json() : null;
        
        if (dataSheet && dataSheet.length >= 2) {
          setData(dataSheet);
          setHeader(dataSheet[0]);
          setInputTypes(dataSheet[1]);
        } else {
          setData(defaultData);
          setHeader(defaultData[0]);
          setInputTypes(defaultData[1]);
        }
      } catch (error) {
        setData(defaultData);
        setHeader(defaultData[0]);
        setInputTypes(defaultData[1]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (header.length > 0) {
      const initialForm = header.reduce((acc, curr) => ({ ...acc, [curr]: "" }), {});
      setFormData(initialForm);
      setIndexRow("");
    }
  }, [data, header]);

  const filteredData = useMemo(() => {
    if (data.length <= 2) return [];
    return data.slice(2).filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(filter.toLowerCase()))
    );
  }, [data, filter]);

  const totalPages = useMemo(() => Math.ceil(filteredData.length / rowsPerPage) || 1, [filteredData]);
  const paginationData = useMemo(() => {
    const endIndex = filteredData.length - (totalPages - page) * rowsPerPage;
    const startIndex = Math.max(0, endIndex - rowsPerPage);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, totalPages]);

  const handleCheckboxChange = (columnName, option, isChecked) => {
    const currentValues = formData[columnName] ? formData[columnName].split(",").map(v => v.trim()).filter(v => v !== "") : [];
    let newValues;
    if (isChecked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }
    setFormData({ ...formData, [columnName]: newValues.join(",") });
  };

  const findRow = (row, error) => {
    const newForm = {};
    header.forEach((h, i) => { newForm[h] = row[i]; });
    setFormData(newForm);
    const idx = data.findIndex((r) => r[0] === row[0] && r[1] === row[1]);
    setIndexRow(idx);
    setErrorClick(error);
  };

  const addRow = () => {
    const maxId = data.slice(2).reduce((max, row) => Math.max(max, Number(row[0]) || 0), 0);
    const newId = maxId + 1;
    const date = new Date().toISOString().split('T')[0];
    const updatedForm = { ...formData, ID: newId, DATE: date };
    const newRowArray = header.map(h => updatedForm[h]);
    setData([...data, newRowArray]);
    setLoading(false);
  };

  return (
    <>
      <style>{`
        #table-container { width: 98%; overflow: auto; }
        #myTable { font-family: sans-serif; border-collapse: collapse; width: 100%; margin-top: 10px; }
        #myTable td, #myTable th { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
        #myTable th { background-color: #04aa6d; color: white; text-align: left; }
        #myTable tr:nth-child(even) { background-color: #f9f9f9; }
        #myTable tr:hover { background-color: #f1f1f1; cursor: pointer; }
        #myTable tr th:first-child, #myTable tr td:first-child { display: none; }
        
        .form-group { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #eee; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: bold; }
        .form-control { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        
        .options-group { display: flex; gap: 15px; flex-wrap: wrap; background: #f8f9fa; padding: 10px; border-radius: 4px; }
        .option-item { display: flex; alignItems: center; gap: 5px; cursor: pointer; }
        
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
      `}</style>

      <div id="table-container">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Lọc dữ liệu..." 
          onChange={(e) => setFilter(e.target.value)} 
        />
        <table id="myTable">
          <thead>
            <tr>{header.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {paginationData.map((row, idx) => (
              <tr key={idx} onClick={() => findRow(row, "")}>
                {row.map((cell, i) => <td key={i}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "30px", background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
        <h3>{indexRow ? "Cập nhật hàng" : "Thêm mới"}</h3>
        <form>
          {header.map((h, i) => {
            const rawType = inputTypes[i] || "text";
            const [type, optionsStr] = rawType.split(":");
            const options = optionsStr ? optionsStr.split(",") : [];

            if (h === "ID" || h === "DATE") return null;

            return (
              <div key={i} className="form-group">
                <label>{h}:</label>
                
                {type === "textarea" ? (
                  <textarea className="form-control" value={formData[h] || ""} onChange={(e) => setFormData({...formData, [h]: e.target.value})} />
                ) : type === "radio" ? (
                  <div className="options-group">
                    {options.map(opt => (
                      <label key={opt} className="option-item">
                        <input type="radio" name={h} checked={formData[h] === opt} onChange={() => setFormData({...formData, [h]: opt})} />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : type === "checkbox" ? (
                  <div className="options-group">
                    {options.map(opt => {
                      const isChecked = formData[h]?.split(",").map(v => v.trim()).includes(opt);
                      return (
                        <label key={opt} className="option-item">
                          <input type="checkbox" checked={isChecked} onChange={(e) => handleCheckboxChange(h, opt, e.target.checked)} />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <input type={type} className="form-control" value={formData[h] || ""} onChange={(e) => setFormData({...formData, [h]: e.target.value})} />
                )}
              </div>
            );
          })}
        </form>
        <button className="btn btn-success" onClick={addRow}>Lưu dữ liệu</button>
        {indexRow && <button className="btn btn-primary" onClick={() => setIndexRow("")}>Hủy chỉnh sửa</button>}
      </div>
    </>
  );
}
