/**
 * TableContainer Component
 *
 * This component provides a highly customizable, paginated, sortable, and searchable table
 * built with `@tanstack/react-table` and styled using Reactstrap.
 *
 * - Supports fetching data dynamically via API or using data passed as props.
 * - Includes debounced global search functionality for filtering table data.
 * - Enables column-level sorting and pagination with page size control.
 *
 * Dependencies:
 * - `@tanstack/react-table`: For advanced table features such as sorting, filtering, and pagination.
 * - `axios`: For making API requests.
 * - `reactstrap`: For UI components such as `Input` and `Pagination`.
 *
 * Props:
 * - `columns`: Array of column definitions for the table.
 * - `data`: (Optional) Array of initial data to populate the table. If not provided, data will be fetched from the `/api/articles` endpoint.
 * - `isGlobalFilter`: (Optional) Boolean to enable or disable global search functionality. Default is `true`.
 * - `customPageSize`: (Optional) Number of rows per page. Default is `10`.
 * - `SearchPlaceholder`: (Optional) Placeholder text for the search input. Default is `"Search..."`.
 * - `tableClass`: (Optional) CSS class for the table element. Default is `"table align-middle table-nowrap"`.
 * - `theadClass`: (Optional) CSS class for the table header. Default is `"table-light"`.
 * - `divClass`: (Optional) CSS class for the table wrapper. Default is `"table-responsive"`.
 */
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
import { Input, Pagination, PaginationItem, PaginationLink } from "reactstrap";

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
  // State variables
  const [globalFilter, setGlobalFilter] = useState("");
  const [articles, setArticles] = useState(data);
  const [filteredArticles, setFilteredArticles] = useState(data);
  const [loading, setLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  /**
   * Fetch articles data if `data` prop is not provided.
   */
  useEffect(() => {
    if (data.length === 0) {
      const fetchArticles = async () => {
        setLoading(true);
        try {
          const response = await axios.get("/api/articles");
          setArticles(response.data || []);
          setFilteredArticles(response.data || []);
        } catch (error) {
          console.error("Error fetching articles:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchArticles();
    } else {
      setArticles(data);
      setFilteredArticles(data);
    }
  }, [data]);

  /**
   * Filter articles based on global search input.
   */
  useEffect(() => {
    if (globalFilter.trim() === "") {
      setFilteredArticles(articles);
    } else {
      const lowerCaseFilter = globalFilter.toLowerCase();
      const filtered = articles.filter((article) =>
        Object.values(article).some((value) =>
          String(value).toLowerCase().includes(lowerCaseFilter),
        ),
      );
      setFilteredArticles(filtered);
    }
  }, [globalFilter, articles]);

  /**
   * Handle search input changes with a 500ms debounce.
   */
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

  /**
   * Custom fuzzy filtering for global search.
   */

  const fuzzyFilter = (row, columnId, value) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    return itemRank.passed;
  };

  // Initialize the table instance
  const table = useReactTable({
    data: filteredArticles,
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

  /**
   * Update the page size whenever `customPageSize` prop changes.
   */
  useEffect(() => {
    table.setPageSize(customPageSize);
  }, [customPageSize, table]);

  /**
   * Generate pagination buttons.
   */
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
        </PaginationItem>,
      );
    }

    return pages;
  };

  console.log("table", table);

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
                          header.getContext(),
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
            <PaginationLink onClick={() => table.nextPage()}>
              Next
            </PaginationLink>
          </PaginationItem>
        </Pagination>
      </div>
    </div>
  );
};

export default TableContainer;
