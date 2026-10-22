sed -i '/\/\/ Controller methods/i \
export const MOCK_REELS = [\
  { id: "r1", user: "@sarah_fit", avatar: "https://i.pravatar.cc/150?u=sarah", video: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80", views: "12K" },\
  { id: "r2", user: "@mike_lifts", avatar: "https://i.pravatar.cc/150?u=mike", video: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80", views: "8.5K" },\
  { id: "r3", user: "@emma_yoga", avatar: "https://i.pravatar.cc/150?u=emma", video: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80", views: "24K" },\
  { id: "r4", user: "@jake_hiit", avatar: "https://i.pravatar.cc/150?u=jake", video: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80", views: "5K" },\
  { id: "r5", user: "@alex_trains", avatar: "https://i.pravatar.cc/150?u=alex", video: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80", views: "19K" }\
];\
\
export const MOCK_POSTS = [\
  {\
    id: "p1",\
    user: { name: "Sarah Jenkins", handle: "@sarah_fit", avatar: "https://i.pravatar.cc/150?u=sarah" },\
    time: "2 hours ago",\
    content: "Just crushed my new PR on deadlifts! 🏋️‍♀️ Thanks to the Beyounge AI coach for the perfect progression plan over the last 6 weeks.",\
    image: "https://images.unsplash.com/photo-1526506114868-874b281b37f4?auto=format&fit=crop&w=800&q=80",\
    likes: 342,\
    comments: 28\
  },\
  {\
    id: "p2",\
    user: { name: "Mike Thompson", handle: "@mike_lifts", avatar: "https://i.pravatar.cc/150?u=mike" },\
    time: "5 hours ago",\
    content: "Post-workout meal prep. The macro scanner makes tracking this so much easier! 🥗",\
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",\
    likes: 124,\
    comments: 12\
  },\
  {\
    id: "p3",\
    user: { name: "Emma Davis", handle: "@emma_yoga", avatar: "https://i.pravatar.cc/150?u=emma" },\
    time: "1 day ago",\
    content: "Morning flow 🧘‍♀️ Focusing on mobility and core strength today. Remember, recovery is just as important as the workout itself!",\
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",\
    likes: 567,\
    comments: 45\
  }\
];\
\n' controllers/pageController.ts
