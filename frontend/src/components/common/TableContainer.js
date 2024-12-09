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
  Button,
  Input,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";

const TableContainer = ({
  columns,
  data,
  isGlobalFilter = true,
  customPageSize = 10,
  SearchPlaceholder = "Search...",
  tableClass = "table align-middle table-nowrap",
  theadClass = "table-light",
  divClass = "table-responsive",
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [articles, setArticles] = useState(data);
  const [loading, setLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const fetchArticles = async (query) => {
    setLoading(true);
    try {
      const response = query
        ? await axios.get(`/api/preferences/search?query=${query}`)
        : await axios.get("/api/articles");
      setArticles(response.data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setGlobalFilter(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      fetchArticles(query);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const fuzzyFilter = (row, columnId, value) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    return itemRank.passed;
  };

  const table = useReactTable({
    data: articles,
    columns,
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: "date", desc: true }], // Default sorting by date in descending order
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
