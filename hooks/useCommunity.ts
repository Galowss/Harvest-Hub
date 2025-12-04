import { useState, useCallback, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { CommunityPost, CommunityComment, UseQueryResult, UseMutationResult } from '@/interfaces';
import { COLLECTIONS } from '@/constants';

/**
 * Hook to fetch all community posts
 */
export function useCommunityPosts(): UseQueryResult<CommunityPost[]> {
  const [data, setData] = useState<CommunityPost[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.COMMUNITY_POSTS),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as CommunityPost[];

      setData(posts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    data,
    loading,
    error,
    refetch: fetchPosts,
  };
}

/**
 * Hook to fetch comments for a post
 */
export function usePostComments(postId: string): UseQueryResult<CommunityComment[]> {
  const [data, setData] = useState<CommunityComment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.COMMUNITY_COMMENTS),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as CommunityComment[];

      setData(comments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    data,
    loading,
    error,
    refetch: fetchComments,
  };
}

/**
 * Hook to create a new community post
 */
export function useCreatePost(): UseMutationResult<CommunityPost, Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommunityPost | null>(null);

  const mutate = useCallback(async (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>) => {
    setLoading(true);
    setError(null);

    try {
      const newPost = {
        ...postData,
        likes: 0,
        likedBy: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.COMMUNITY_POSTS), newPost);
      
      const post = {
        id: docRef.id,
        ...postData,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CommunityPost;

      setData(post);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
  };
}

/**
 * Hook to like/unlike a post
 */
export function useLikePost(): UseMutationResult<CommunityPost, { postId: string; userId: string; isLiked: boolean }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommunityPost | null>(null);

  const mutate = useCallback(async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
    if (!postId || !userId) {
      setError('Invalid parameters');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.COMMUNITY_POSTS, postId);
      
      if (isLiked) {
        // Unlike
        await updateDoc(docRef, {
          likes: -1,
          likedBy: arrayRemove(userId),
          updatedAt: Timestamp.now(),
        });
      } else {
        // Like
        await updateDoc(docRef, {
          likes: 1,
          likedBy: arrayUnion(userId),
          updatedAt: Timestamp.now(),
        });
      }

      // Note: In a real implementation, you might want to fetch the updated post
      // For now, returning null as the component should refetch
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like status';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
  };
}

/**
 * Hook to add a comment to a post
 */
export function useAddComment(): UseMutationResult<CommunityComment, Omit<CommunityComment, 'id' | 'createdAt'>> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommunityComment | null>(null);

  const mutate = useCallback(async (commentData: Omit<CommunityComment, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const newComment = {
        ...commentData,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.COMMUNITY_COMMENTS), newComment);
      
      const comment = {
        id: docRef.id,
        ...commentData,
        createdAt: new Date(),
      } as CommunityComment;

      setData(comment);
      return comment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
  };
}
