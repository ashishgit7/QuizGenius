
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain,
  Clock,
  Calendar,
  Trash2,
  PlusCircle,
  Search,
  SortAsc,
  InfoIcon,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { getAllQuizzes, deleteQuiz } from '@/server';
import { Quiz } from '@/types/quiz';

const QuizzesList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  
  useEffect(() => {
    // Load quizzes from server
    const loadQuizzes = async () => {
      try {
        const serverQuizzes = await getAllQuizzes();
        setQuizzes(serverQuizzes);
      } catch (error) {
        console.error('Error loading quizzes:', error);
        toast.error('Failed to load quizzes');
      }
    };
    
    loadQuizzes();
  }, []);
  
  const handleCreateQuiz = () => {
    navigate('/create');
  };
  
  const handleDeleteQuiz = (id: string) => {
    setQuizToDelete(id);
    setDeleteDialogOpen(true);
  };
  const handleEditQuiz = (id: string, newTitle:string) => {
    
    setQuizzes((prevQuizzes) =>
      prevQuizzes.map((q) =>
        q.id === id ? { ...q, title: newTitle } : q
      )
    );
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
  };
  
  const confirmDelete = () => {
    if (!quizToDelete) return;
    
    try {
      const success = deleteQuiz(quizToDelete);
      if (success) {
        // Update local state after server operation succeeds
        setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizToDelete));
        toast.success('Quiz deleted successfully');
      } else {
        toast.error('Failed to delete quiz');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } finally {
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const getQuizTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'true-false': return 'True/False';
      case 'fill-blank': return 'Fill in the Blank';
      case 'short-answer': return 'Short Answer';
      case 'mixed': return 'Mixed Types';
      default: return type;
    }
  };
  
  const sortedAndFilteredQuizzes = () => {
    // First filter by search query
    const filtered = quizzes.filter(quiz => 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Then sort by the selected order
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  };
  
  const getSortLabel = () => {
    switch (sortOrder) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'a-z': return 'A to Z';
      case 'z-a': return 'Z to A';
      default: return 'Sort';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold gradient-heading">My Quizzes</h1>
            <Button 
              onClick={handleCreateQuiz}
              className="bg-quiz-primary hover:bg-quiz-primary/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-auto flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 w-full"
                  placeholder="Search quizzes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    {getSortLabel()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder('a-z')}>
                    A to Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('z-a')}>
                    Z to A
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {sortedAndFilteredQuizzes().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAndFilteredQuizzes().map(quiz => (
                <div 
                  key={quiz.id}
                  className="quiz-card cursor-pointer"
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-full bg-quiz-secondary/30">
                      <Brain className="h-5 w-5 text-quiz-primary" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuiz(quiz.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                    <div className="flex justify-between items-center">
                      {quiz.isEditing ? (
                        <input
                          type="text"
                          value={quiz.title}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            handleEditQuiz(quiz.id, e.target.value);
                          }}
                          onKeyDown={(e)=>{
                            if (e.key === 'Enter') {
                              setQuizzes((prevQuizzes) =>
                                prevQuizzes.map((q) =>
                                  q.id === quiz.id ? { ...q, isEditing: false } : q
                                )
                              );
                            }
                          }}
                          onBlur={(e)=>{
                            setQuizzes((prevQuizzes) =>
                              prevQuizzes.map((q) =>
                                q.id === quiz.id ? { ...q, isEditing: false } : q
                              )
                            );
                          }
                          }
                          
                          className="text-lg font-medium mb-2 line-clamp-2 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <span
                          className="text-lg font-medium mb-2 line-clamp-2"
                          onClick={() => {
                            setQuizzes((prevQuizzes) =>
                              prevQuizzes.map((q) =>
                                q.id === quiz.id ? { ...q, isEditing: true } : q
                              )
                            );
                          }}
                        >
                          {quiz.title}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuizzes((prevQuizzes) =>
                            prevQuizzes.map((q) =>
                              q.id === quiz.id ? { ...q, isEditing: true } : q
                            )
                          );
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-muted/50 px-2 py-1 rounded-full text-xs">
                      {quiz.questions.length} Questions
                    </div>
                    <div className="bg-muted/50 px-2 py-1 rounded-full text-xs capitalize">
                      {quiz.settings.difficulty}
                    </div>
                    <div className="bg-muted/50 px-2 py-1 rounded-full text-xs">
                      {getQuizTypeLabel(quiz.settings.quizType)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(quiz.createdAt)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.settings.timeLimit > 0 ? `${quiz.settings.timeLimit} min` : 'No time limit'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <div className="p-4 rounded-full bg-quiz-secondary/30 mb-4 inline-block">
                <InfoIcon className="h-8 w-8 text-quiz-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Quizzes Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'No quizzes match your search query.' : 'You haven\'t created any quizzes yet.'}
              </p>
              <Button 
                onClick={handleCreateQuiz}
                className="bg-quiz-primary hover:bg-quiz-primary/90"
              >
                Create Your First Quiz
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quiz? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizzesList;
