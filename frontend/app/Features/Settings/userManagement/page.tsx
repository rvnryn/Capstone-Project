/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { FaUsers, FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import { useUsersAPI } from "./hook/use-user";
import type { User } from "./hook/use-user";
import ResponsiveMain from "@/app/components/ResponsiveMain";

const columns = [
  { key: "user_id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "username", label: "Username" },
  { key: "email", label: "Gmail" },
  { key: "user_role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export default function UserManagement() {
  const router = useRouter();
  const { isMenuOpen, isMobile } = useNavigation();
  const { listUsers, deleteUser, changeUserPassword } = useUsersAPI();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  // Add state for password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAuthId, setPasswordAuthId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    listUsers()
      .then((data: User[]) => {
        console.log("Fetched users:", data); // Add this line
        setUsers(
          data.map((user) => ({
            ...user,
            last_login: user.last_login ?? "",
          }))
        );
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [listUsers]);

  useEffect(() => {
    const sortedUsers = [...users];
    if (sortConfig.key !== "actions") {
      sortedUsers.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    setFilteredUsers(sortedUsers);
  }, [users, sortConfig]);

  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      try {
        await deleteUser(itemToDelete);
        setUsers(users.filter((user) => user.user_id !== itemToDelete));
      } catch (error) {
        console.error("Error deleting user:", error);
      } finally {
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    }
  };

  function getMainContentStyles(): string {
    // Adjusts main content padding based on navigation menu and mobile state
    if (isMobile) {
      return "pt-24 px-2";
    }
    return isMenuOpen
      ? "ml-64 pt-24 px-8 transition-all duration-300"
      : "pt-24 px-8 transition-all duration-300";
  }

  function requestSort(key: string): void {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction if same key
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Default to ascending for new key
      return { key, direction: "asc" };
    });
  }

  // Show button if sort or filter/search is active
  const isFilteredOrSorted =
    sortConfig.key !== "" || (searchTerm && searchTerm.trim() !== "");

  return (
    <section className="text-white font-poppins">
      <NavigationBar
        showDeleteModal={showDeleteModal}
        showPasswordModal={showPasswordModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="User Management main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                        <FaUsers className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        User Management
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage all users and their access
                      </p>
                    </div>
                  </div>
                  <nav
                    aria-label="User actions"
                    className="flex items-center gap-1 xs:gap-2 sm:gap-3 w-full sm:w-auto"
                  >
                    <button
                      onClick={() => router.push(routes.addUsers)}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2 cursor-pointer text-xs xs:text-sm sm:text-base whitespace-nowrap"
                    >
                      <FaPlus className="text-xs xs:text-sm" />
                      <span className="sm:inline">Add New User</span>
                    </button>
                  </nav>
                </div>
              </header>
              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/85 text-xs xs:text-sm">
                    User Management
                  </span>
                </div>
              </div>
              {/* Show button if sort or filter/search is active */}
              {isFilteredOrSorted && (
                <button
                  type="button"
                  onClick={() => {
                    setSortConfig({ key: "", direction: "asc" });
                    setSearchTerm("");
                    // Reset other filters if you add them
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200 mb-4"
                >
                  Clear Filter
                </button>
              )}
              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="User table"
              >
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                    <caption className="sr-only">User Table</caption>
                    <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            onClick={() =>
                              col.key !== "actions" && requestSort(col.key)
                            }
                            className={`px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${
                              col.key !== "actions"
                                ? "text-gray-300 hover:text-yellow-400"
                                : "text-gray-300"
                            } ${
                              sortConfig.key === col.key
                                ? "text-yellow-400"
                                : ""
                            }`}
                            scope="col"
                          >
                            <div className="flex items-center gap-1 xs:gap-2">
                              {col.label}
                              {sortConfig.key === col.key &&
                                col.key !== "actions" && (
                                  <span className="text-yellow-400">
                                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-8 xs:py-10 sm:py-12 md:py-14 lg:py-16 text-center"
                          >
                            <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4">
                              <div className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 border-2 xs:border-3 sm:border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                              <div className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl font-medium">
                                Loading users...
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                          <tr
                            key={user.user_id}
                            className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                              index % 2 === 0
                                ? "bg-gray-800/20"
                                : "bg-gray-900/20"
                            }`}
                            onClick={() =>
                              router.push(
                                routes.ViewUsers(String(user.user_id))
                              )
                            }
                          >
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                              {user.user_id}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap">
                              <span className="text-white group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                                {user.name}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm sm:text-base">
                              {user.username}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300">
                              <span className="px-1 xs:px-2 py-0.5 xs:py-1 bg-gray-700/50 rounded-md xs:rounded-lg text-xs font-medium">
                                {user.email}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap">
                              <span className="px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-full text-xs font-bold border bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {user.user_role}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap">
                              <span
                                className={`font-bold px-2 py-1 rounded-full text-xs border ${
                                  user.status === "active"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                                }`}
                              >
                                {user.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 xl:px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 xl:gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      routes.UpdateUsers(String(user.user_id))
                                    );
                                  }}
                                  className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-300 transition-all duration-200 cursor-pointer border border-yellow-400/20 hover:border-yellow-400/40"
                                  title="Edit"
                                  aria-label="Edit user"
                                >
                                  <FaEdit className="text-xs xs:text-sm" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToDelete(
                                      typeof user.user_id === "number"
                                        ? user.user_id
                                        : null
                                    );
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all duration-200 cursor-pointer border border-red-500/20 hover:border-red-500/40"
                                  title="Delete"
                                  aria-label="Delete user"
                                >
                                  <FaTrashAlt className="text-xs xs:text-sm" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-4 xl:px-6 py-12 xl:py-16 text-center"
                          >
                            <div className="flex flex-col items-center gap-4">
                              <FaUsers className="text-6xl text-gray-600" />
                              <div>
                                <h2 className="text-gray-400 font-medium mb-2">
                                  No users found
                                </h2>
                                <p className="text-gray-500 text-sm">
                                  Try adjusting your search or filter criteria
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </article>
          </div>
        </main>
        {showDeleteModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-3 xs:p-4 sm:p-6 md:p-8 rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 max-w-xs xs:max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg xs:blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2 xs:p-3 sm:p-4 rounded-full">
                    <FaTrashAlt className="text-white text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
              </div>
              <h2
                id="delete-dialog-title"
                className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-red-400 to-red-500 bg-clip-text font-poppins"
              >
                Confirm Deletion
              </h2>
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base">
                Are you sure you want to delete this user? This action cannot be
                undone and will permanently remove the user.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-red-500/70 text-red-400 hover:bg-red-500 hover:text-white font-semibold transition-all duration-300 order-2 sm:order-1 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  <FaTrashAlt className="group-hover:scale-110 transition-transform duration-300" />
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 order-1 sm:order-2 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
