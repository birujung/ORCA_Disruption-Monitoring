import { rankItem } from "@tanstack/match-sorter-utils";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Input,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";

const TableContainer = ({
  columns,
  data = [], // Data awal dari props
  isGlobalFilter = true,
  customPageSize = 10,
  SearchPlaceholder = "Search...",
  tableClass = "table align-middle table-nowrap",
  theadClass = "table-light",
  divClass = "table-responsive",
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [articles, setArticles] = useState(data); // Data mentah dari API atau props
  const [filteredArticles, setFilteredArticles] = useState(data); // Data yang ditampilkan di tabel
  const [loading, setLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Fetch data dari API jika `data` tidak diisi
  useEffect(() => {
    if (data.length === 0) {
      const fetchArticles = async () => {
        setLoading(true);
        try {
          const response = await axios.get("/api/articles");
          setArticles(response.data || []);
          setFilteredArticles(response.data || []); // Pastikan langsung tampil
        } catch (error) {
          console.error("Error fetching articles:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchArticles();
    } else {
      setArticles(data); // Jika data dari props
      setFilteredArticles(data);
    }
  }, [data]);

  // Filter data berdasarkan input search bar
  useEffect(() => {
    if (globalFilter.trim() === "") {
      setFilteredArticles(articles); // Tampilkan semua data jika input kosong
    } else {
      const lowerCaseFilter = globalFilter.toLowerCase();
      const filtered = articles.filter((article) =>
        Object.values(article).some((value) =>
          String(value).toLowerCase().includes(lowerCaseFilter)
        )
      );
      setFilteredArticles(filtered);
    }
  }, [globalFilter, articles]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setGlobalFilter(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      setGlobalFilter(query);
    }, 500); // Debounce 500ms

    setDebounceTimeout(timeout);
  };

  const fuzzyFilter = (row, columnId, value) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    return itemRank.passed;
  };

  const table = useReactTable({
    data: filteredArticles, // Data yang sudah difilter
    columns,
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: "date", desc: true }],
    },
  });

  useEffect(() => {
    table.setPageSize(customPageSize);
  }, [customPageSize, table]);

  const getPageNumbers = () => {
    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex;
    const pages = [];

    for (let i = 0; i < totalPages; i++) {
      pages.push(
        <PaginationItem active={currentPage === i} key={i}>
          <PaginationLink onClick={() => table.setPageIndex(i)}>
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <div>
      {isGlobalFilter && (
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <Input
            type="search"
            placeholder={SearchPlaceholder}
            value={globalFilter || ""}
            onChange={handleSearchChange}
            className="form-control w-25"
            disabled={loading}
          />
        </div>
      )}

      <div className={divClass}>
        <table className={tableClass}>
          <thead className={theadClass}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ cursor: "pointer" }}
                    onClick={header.column.getToggleSortingHandler()} // Enable sorting on column header click
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getIsSorted() === "asc"
                      ? " ▲"
                      : header.column.getIsSorted() === "desc"
                      ? " ▼"
                      : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          Showing {table.getState().pagination.pageSize} of{" "}
          {table.getPrePaginationRowModel().rows.length} results
        </div>
        <Pagination>
          <PaginationItem disabled={!table.getCanPreviousPage()}>
            <PaginationLink onClick={() => table.previousPage()}>
              Previous
            </PaginationLink>
          </PaginationItem>
          {getPageNumbers()}
          <PaginationItem disabled={!table.getCanNextPage()}>
            <PaginationLink onClick={() => table.nextPage()}>Next</PaginationLink>
          </PaginationItem>
        </Pagination>
      </div>
    </div>
  );
};

export default TableContainer;
