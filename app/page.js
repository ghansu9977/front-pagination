"use client";
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx'; // Import XLSX

const Home = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/data');
                const result = await response.json();
                console.log(result);
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center">Loading...</div>;

    // Filter data based on search term
    const filteredData = data.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate current data to display
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Calculate total pages
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (event) => {
        setItemsPerPage(Number(event.target.value));
        setCurrentPage(1); // Reset to the first page
    };

    // Function to download PDF
    const downloadPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["ID", "Title", "Description", "Status", "Category", "Date"];
        const tableRows = currentItems.map(item => [
            item.id,
            item.title,
            item.description,
            item.status_name,
            item.category_name,
            new Date(item.date_column).toLocaleDateString()
        ]);

        autoTable(doc, { columns: tableColumn.map(col => ({ title: col, dataKey: col.toLowerCase() })), body: tableRows });
        doc.save('data.pdf');
    };

    // Function to download Excel
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(currentItems.map(item => ({
            ID: item.id,
            Title: item.title,
            Description: item.description,
            Status: item.status_name,
            Category: item.category_name,
            Date: new Date(item.date_column).toLocaleDateString()
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, 'data.xlsx');
    };

    // Function to download CSV
    const downloadCSV = () => {
        const csvContent = [
            ["ID", "Title", "Description", "Status", "Category", "Date"], // Header
            ...currentItems.map(item => [
                item.id,
                item.title,
                item.description,
                item.status_name,
                item.category_name,
                new Date(item.date_column).toLocaleDateString()
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mt-5">
            <h1 className="mb-4">Data Table</h1>

            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="input-group-append">
                    <span className="input-group-text">
                        <i className="bi bi-search"></i>
                    </span>
                </div>
            </div>

            {/* Buttons to download PDF, Excel, and CSV */}
            <div className="mb-3">
                <button className="btn btn-primary me-2" onClick={downloadPDF}>
                    Download PDF
                </button>
                <button className="btn btn-success me-2" onClick={downloadExcel}>
                    Download Excel
                </button>
                <button className="btn btn-info" onClick={downloadCSV}>
                    Download CSV
                </button>
            </div>

            <table className="table table-bordered table-striped">
                <thead className="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.title}</td>
                            <td>{item.description}</td>
                            <td>{item.status_name}</td>
                            <td>{item.category_name}</td>
                            <td>{new Date(item.date_column).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <nav>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <label htmlFor="itemsPerPage" className="me-2">Items per page:</label>
                        <select
                            id="itemsPerPage"
                            className="form-select form-select-sm d-inline-block w-auto"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                    </div>

                    {/* Pagination */}
                    <ul className="pagination mb-0">
                        {[...Array(totalPages)].map((_, index) => (
                            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </div>
    );
};

export default Home;
