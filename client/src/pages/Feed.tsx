import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Share2, 
  ThumbsUp, 
  MoreHorizontal,
  Send,
  UserCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import axios from 'axios';
// Interface for post type
interface Post {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  quizId?: string;
  quizTitle?: string;
}

// Interface for comment type
interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const postsPerPage = 5;
  
  // Load posts and quizzes from localStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const postData = await axios.get('/api/posts');
        const savedPosts = postData.data.posts;

        const savedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        setPosts(savedPosts);
        setLoading(false);
        setQuizzes(savedQuizzes);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load feed content');
      }
    };

    fetchData();
  }, []);
  
  // Save posts to localStorage when changed
  useEffect(() => {
    localStorage.setItem('feedPosts', JSON.stringify(posts));
  }, [posts]);
  
  const handleCreatePost = () => {
    if (!newPostContent.trim() && !selectedQuiz) {
      toast.error('Please enter some content or select a quiz to share');
      return;
    }
    
    const selectedQuizData = selectedQuiz 
      ? quizzes.find(quiz => quiz.id === selectedQuiz) 
      : null;
      
    const newPost: Post = {
      id: (Math.floor(Math.random() * 1000000) + 1).toString(),
      content: newPostContent.trim(),
      author: 'Anonymous User', // Would be replaced with actual user name in a real app
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      quizId: selectedQuiz || undefined,
      quizTitle: selectedQuizData?.title
    };
    // Add the new post to the beginning of the posts array
    axios.post('/api/posts', { post: newPost })
    
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setSelectedQuiz(null);
    toast.success('Post created successfully');
  };
  
  const handleLikePost = (postId: string) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 } 
          : post
      )
    );
  };
  
  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    toast.success('Post deleted successfully');
  };
  
  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    const newComment: Comment = {
      id: (Math.floor(Math.random() * 1000000) + 1).toString(),
      content: commentText.trim(),
      author: 'Anonymous User',
      createdAt: new Date().toISOString()
    };
    
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, newComment] } 
          : post
      )
    );
    
    setCommentText('');
    setShowCommentInput(null);
    toast.success('Comment added');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  return (
    loading ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-quiz-primary border-gray-200 rounded-full animate-spin"></div>
        </div>
      </div>
    ) : (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold gradient-heading mb-8">Quiz Feed</h1>
          
          {/* Create Post Box */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-quiz-secondary/30">
                  <UserCircle className="h-5 w-5 text-quiz-primary" />
                </div>
                <p className="font-medium">Share something with the community</p>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What's on your mind?"
                className="min-h-24 mb-4"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              
              {quizzes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Share a quiz (optional)
                  </label>
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedQuiz || ''}
                    onChange={(e) => setSelectedQuiz(e.target.value || null)}
                  >
                    <option value="">Select a quiz to share</option>
                    {quizzes.map(quiz => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={handleCreatePost}
                className="bg-quiz-primary hover:bg-quiz-primary/90"
                disabled={!newPostContent.trim() && !selectedQuiz}
              >
                <Send className="mr-2 h-4 w-4" /> Post
              </Button>
            </CardFooter>
          </Card>
          
          {/* Feed Posts */}
          {currentPosts.length > 0 ? (
            <div className="space-y-6">
              {currentPosts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-quiz-secondary/30">
                          <UserCircle className="h-5 w-5 text-quiz-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{post.author}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatDate(post.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Report Post</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Post content */}
                    {post.content && (
                      <p className="mb-4 whitespace-pre-line">{post.content}</p>
                    )}
                    
                    {/* Shared quiz card */}
                    {post.quizId && post.quizTitle && (
                      <div 
                        className="border rounded-md p-4 bg-muted/20 cursor-pointer hover:bg-muted/40 transition"
                        onClick={() => navigate(`/quiz/${post.quizId}`)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-full bg-quiz-secondary/30">
                            <MessageSquare className="h-4 w-4 text-quiz-primary" />
                          </div>
                          <p className="font-medium text-sm">Shared Quiz</p>
                        </div>
                        <h3 className="text-lg font-medium">{post.quizTitle}</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quiz/${post.quizId}`);
                          }}
                        >
                          View Quiz
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="border-t pt-4 flex flex-col">
                    <div className="flex justify-between w-full mb-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => handleLikePost(post.id)}
                      >
                        <ThumbsUp className="mr-1 h-4 w-4" />
                        {post.likes > 0 ? post.likes : 'Like'}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" />
                        {post.comments.length > 0 ? post.comments.length : 'Comment'}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => {
                          // In a real app, this would open a share dialog
                          navigator.clipboard.writeText(`Check out this post: ${window.location.origin}/feed?post=${post.id}`);
                          toast.success('Link copied to clipboard');
                        }}
                      >
                        <Share2 className="mr-1 h-4 w-4" />
                        Share
                      </Button>
                    </div>
                    
                    {/* Comment input */}
                    {showCommentInput === post.id && (
                      <div className="w-full flex gap-2 mb-4">
                        <Textarea
                          placeholder="Write a comment..."
                          className="min-h-16 flex-1"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <Button 
                          size="sm" 
                          className="self-end"
                          onClick={() => handleAddComment(post.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <div className="w-full space-y-3 mt-2">
                        {post.comments.map(comment => (
                          <div key={comment.id} className="bg-muted/20 p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">{comment.author}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                          }} 
                        />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          }} 
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <p className="text-xl font-medium mb-2">No Posts Yet</p>
              <p className="text-muted-foreground mb-6">
                Be the first to create a post in the community!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  ));
};

export default Feed;
