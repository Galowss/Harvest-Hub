"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  increment,
  where,
  Timestamp,
} from "firebase/firestore";

interface Post {
  id: string;
  title: string;
  content: string;
  category: "tip" | "success-story" | "question" | "discussion";
  author: string;
  authorId: string;
  authorRole: "farmer" | "user";
  likes: number;
  comments: number;
  createdAt: any;
  tags: string[];
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: any;
}

export default function CommunityHubPage() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "tip" as "tip" | "success-story" | "question" | "discussion",
    tags: "",
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUser({ id: currentUser.uid, ...docSnap.data() });
        await fetchPosts();
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPosts = async () => {
    try {
      const q = query(
        collection(db, "community_posts"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const querySnapshot = await getDocs(q);

      const postsData: Post[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Post));

      setPosts(postsData);
      setFilteredPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const q = query(
        collection(db, "community_comments"),
        where("postId", "==", postId),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);

      const commentsData: Comment[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Comment));

      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const tags = newPost.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await addDoc(collection(db, "community_posts"), {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        author: user.name || user.email,
        authorId: user.id,
        authorRole: user.role || "farmer",
        likes: 0,
        comments: 0,
        tags,
        createdAt: new Date(),
      });

      alert("Post created successfully!");
      setShowCreateModal(false);
      setNewPost({
        title: "",
        content: "",
        category: "tip",
        tags: "",
      });
      await fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, {
        likes: increment(1),
      });
      await fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedPost || !newComment.trim()) return;

    try {
      await addDoc(collection(db, "community_comments"), {
        postId: selectedPost.id,
        content: newComment,
        author: user.name || user.email,
        authorId: user.id,
        createdAt: new Date(),
      });

      // Update comment count
      const postRef = doc(db, "community_posts", selectedPost.id);
      await updateDoc(postRef, {
        comments: increment(1),
      });

      setNewComment("");
      await fetchComments(selectedPost.id);
      await fetchPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleViewPost = async (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
    await fetchComments(post.id);
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  // Filter posts
  useEffect(() => {
    let filtered = [...posts];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    setFilteredPosts(filtered);
  }, [selectedCategory, searchTerm, posts]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isFarmer = user?.role === "farmer";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a
            href={isFarmer ? "/dashboard/farmer" : "/dashboard/user"}
            className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
          >
            Dashboard
          </a>
          {isFarmer && (
            <>
              <a
                href="/dashboard/farmer/profile"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Profile
              </a>
              <a
                href="/dashboard/farmer/orders"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Orders
              </a>
              <a
                href="/dashboard/farmer/pricing"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Market Pricing
              </a>
              <a
                href="/dashboard/farmer/wallet"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Digital Wallet
              </a>
            </>
          )}
          {!isFarmer && (
            <>
              <a
                href="/dashboard/user/cart"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Cart
              </a>
              <a
                href="/dashboard/user/orders"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Orders
              </a>
              <a
                href="/dashboard/user/wallet"
                className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
              >
                Digital Wallet
              </a>
            </>
          )}
          <a
            href="/dashboard/community"
            className="block px-3 py-2 rounded bg-green-100 text-green-800 whitespace-nowrap text-sm lg:text-base"
          >
            Community Hub
          </a>
          <a
            href="/dashboard/map"
            className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base"
          >
            Farmer Map
          </a>
        </nav>

        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            🌾 Community & Knowledge Hub
          </h1>
          <p className="text-gray-600">
            Share tips, success stories, and learn from fellow farmers
          </p>
        </header>

        {/* Search and Filter */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              <option value="tip">Tips & Best Practices</option>
              <option value="success-story">Success Stories</option>
              <option value="question">Questions</option>
              <option value="discussion">Discussions</option>
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              + New Post
            </button>
          </div>
        </section>

        {/* Posts Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer"
                onClick={() => handleViewPost(post)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.category === "tip"
                        ? "bg-blue-100 text-blue-800"
                        : post.category === "success-story"
                        ? "bg-green-100 text-green-800"
                        : post.category === "question"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {post.category === "tip" && "💡 Tip"}
                    {post.category === "success-story" && "🌟 Success"}
                    {post.category === "question" && "❓ Question"}
                    {post.category === "discussion" && "💬 Discussion"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {post.createdAt?.toDate?.().toLocaleDateString() || "Recent"}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {post.content}
                </p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                      className="flex items-center space-x-1 hover:text-green-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      <span>{post.comments}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    by {post.author}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No posts found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create First Post
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) =>
                    setNewPost({
                      ...newPost,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="tip">💡 Tip & Best Practice</option>
                  <option value="success-story">🌟 Success Story</option>
                  <option value="question">❓ Question</option>
                  <option value="discussion">💬 Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Content
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) =>
                    setNewPost({ ...newPost, tags: e.target.value })
                  }
                  placeholder="e.g. organic, irrigation, pest-control"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Post Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPost.category === "tip"
                      ? "bg-blue-100 text-blue-800"
                      : selectedPost.category === "success-story"
                      ? "bg-green-100 text-green-800"
                      : selectedPost.category === "question"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {selectedPost.category === "tip" && "💡 Tip"}
                  {selectedPost.category === "success-story" && "🌟 Success"}
                  {selectedPost.category === "question" && "❓ Question"}
                  {selectedPost.category === "discussion" && "💬 Discussion"}
                </span>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-2">{selectedPost.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <span>by {selectedPost.author}</span>
              <span>•</span>
              <span>
                {selectedPost.createdAt?.toDate?.().toLocaleDateString() ||
                  "Recent"}
              </span>
            </div>

            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPost.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="prose max-w-none mb-6">
              <p className="whitespace-pre-wrap">{selectedPost.content}</p>
            </div>

            <div className="flex items-center space-x-6 pb-4 border-b">
              <button
                onClick={() => handleLikePost(selectedPost.id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>{selectedPost.likes} Likes</span>
              </button>
              <div className="flex items-center space-x-2 text-gray-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <span>{comments.length} Comments</span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Comments</h3>

              {/* Add Comment */}
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleAddComment}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {comment.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.createdAt?.toDate?.().toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
