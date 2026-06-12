"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/lib/AuthContext";
import FileCard from "@/components/FileCard";
import FolderCard from "@/components/FolderCard";
import UploadButton from "@/components/UploadButton";
import CreateFolderModal from "@/components/CreateFolderModal";
import StorageUsage from "@/components/StorageUsage";
import DarkModeToggle from "@/components/DarkModeToggle";
import { IFile } from "@/models/File";
import { IFolder } from "@/models/Folder";
import { 
  Cloud, 
  Search, 
  Grid3X3, 
  List, 
  FolderPlus, 
  Upload,
  Files,
  Share2,
  Clock,
  Trash2,
  ChevronRight,
  User,
  LogOut
} from "lucide-react";

type ViewMode = "grid" | "list";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export default function DashboardPage() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<IFile[]>([]);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "My Files" },
  ]);

  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<IFolder | null>(null);

  const fetchContents = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    setError("");
    try {
      const [filesRes, foldersRes] = await Promise.all([
        axios.get(`/api/files?folderId=${currentFolderId ?? ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/folders?parentId=${currentFolderId ?? ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setFiles(filesRes.data.files);
      setFolders(foldersRes.data.folders);
    } catch {
      setError("Failed to load contents. Please try again.");
    } finally {
      setFetching(false);
    }
  }, [token, currentFolderId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (token) fetchContents();
  }, [token, fetchContents]);

  // Navigate into a folder
  const openFolder = (folder: IFolder) => {
    setCurrentFolderId(String(folder._id));
    setBreadcrumbs((prev) => [...prev, { id: String(folder._id), name: folder.name }]);
    setSearch("");
  };

  // Navigate via breadcrumb
  const navigateTo = (crumb: BreadcrumbItem, index: number) => {
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setSearch("");
  };

  // Create folder
  const handleCreateFolder = async (name: string) => {
    setShowCreateFolder(false);
    try {
      await axios.post(
        "/api/folders",
        { name, parentId: currentFolderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchContents();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create folder");
    }
  };

  // Rename folder
  const handleRenameFolder = async (name: string) => {
    if (!renamingFolder) return;
    setRenamingFolder(null);
    try {
      await axios.patch(
        `/api/folders/${renamingFolder._id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchContents();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to rename folder");
    }
  };

  // Delete folder
  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await axios.delete(`/api/folders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFolders((prev) => prev.filter((f) => String(f._id) !== id));
    } catch {
      alert("Failed to delete folder.");
    }
  };

  // Delete file
  const handleDeleteFile = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await axios.delete(`/api/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles((prev) => prev.filter((f) => String(f._id) !== id));
    } catch {
      alert("Failed to delete file.");
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const isEmpty = !fetching && filteredFiles.length === 0 && filteredFolders.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">CloudDrive</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Hello, {user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 border-r border-gray-200 min-h-[calc(100vh-73px)] p-6 hidden lg:block">
          <nav className="space-y-2 mb-8">
            <a 
              href="#" 
              className="flex items-center gap-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium"
            >
              <Files className="w-5 h-5" />
              My Files
            </a>
            <a 
              href="#" 
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Shared
            </a>
            <a 
              href="#" 
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Clock className="w-5 h-5" />
              Recent
            </a>
            <a 
              href="#" 
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Trash
            </a>
          </nav>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Storage</h3>
            <StorageUsage />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                <button
                  onClick={() => navigateTo(crumb, i)}
                  className={`hover:text-blue-600 transition-colors ${
                    i === breadcrumbs.length - 1
                      ? "text-gray-900 font-medium pointer-events-none"
                      : "hover:underline"
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </nav>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {breadcrumbs[breadcrumbs.length - 1].name}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 ${
                  view === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <UploadButton folderId={currentFolderId} onUploaded={fetchContents} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchContents} className="underline text-xs">Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {fetching && (
          <div
            className={`grid gap-4 ${
              view === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? "No files found" : "No files yet"}
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              {search
                ? "Try adjusting your search terms"
                : "Upload your first file to get started with CloudDrive!"}
            </p>
            {!search && (
              <div className="mt-6">
                <UploadButton folderId={currentFolderId} onUploaded={fetchContents} />
              </div>
            )}
          </div>
        )}

        {/* Contents */}
        {!fetching && (filteredFolders.length > 0 || filteredFiles.length > 0) && (
          <div className="space-y-8">
            {/* Folders section */}
            {filteredFolders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Folders ({filteredFolders.length})
                </p>
                <div
                  className={`grid gap-4 ${
                    view === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={String(folder._id)}
                      folder={folder}
                      view={view}
                      onOpen={openFolder}
                      onDelete={handleDeleteFolder}
                      onRename={setRenamingFolder}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files section */}
            {filteredFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Files ({filteredFiles.length})
                </p>
                <div
                  className={`grid gap-4 ${
                    view === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={String(file._id)}
                      file={file}
                      view={view}
                      onDelete={handleDeleteFile}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        </main>
      </div>

      {/* Create folder modal */}
      {showCreateFolder && (
        <CreateFolderModal
          onConfirm={handleCreateFolder}
          onClose={() => setShowCreateFolder(false)}
        />
      )}

      {/* Rename folder modal */}
      {renamingFolder && (
        <CreateFolderModal
          title="Rename Folder"
          initialName={renamingFolder.name}
          onConfirm={handleRenameFolder}
          onClose={() => setRenamingFolder(null)}
        />
      )}
    </div>
  );
}
