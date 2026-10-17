const L = (id, title, minutes, points, extra = {}) => ({ id, title, minutes, points, ...extra });

const OS_MODULES = [
  {
    id: 'os-m1', title: 'Process Scheduling',
    lessons: [
      L('os-m1-l1', 'Processes and the PCB', 8, ['A process is a program in execution with its own address space', 'The PCB stores state, registers, and scheduling information', 'Processes move between new, ready, running, waiting, and terminated']),
      L('os-m1-l2', 'CPU scheduling algorithms', 14, ['FCFS is simple but suffers from the convoy effect', 'SJF minimises average waiting time but can starve long jobs', 'Priority scheduling needs aging to stay fair']),
      L('os-m1-l3', 'Round Robin in practice', 10, ['Each process gets a fixed time quantum before being preempted', 'A very small quantum wastes time on context switches', 'A very large quantum behaves like FCFS']),
    ],
  },
  {
    id: 'os-m2', title: 'Memory Management',
    lessons: [
      L('os-m2-l1', 'Memory allocation basics', 9, ['Contiguous allocation causes external fragmentation', 'Paging removes external fragmentation', 'Internal fragmentation appears in the last page of a process']),
      L('os-m2-l2', 'Paging made simple', 10, ['Logical memory is split into pages and physical memory into frames of equal size', 'The page table maps each page number to a frame number', 'The offset is copied unchanged because pages and frames are the same size'], { diagram: 'paging' }),
      L('os-m2-l3', 'Page replacement algorithms', 12, ['FIFO is easy but can suffer from Belady\'s anomaly', 'LRU approximates the optimal policy using recent history', 'Optimal replacement is a benchmark, not a practical policy']),
      L('os-m2-l4', 'Virtual memory and thrashing', 11, ['Demand paging loads pages only when they are touched', 'Thrashing happens when processes spend more time paging than executing', 'The working-set model keeps each process\'s active pages resident']),
    ],
  },
  {
    id: 'os-m3', title: 'Deadlocks',
    lessons: [
      L('os-m3-l1', 'The four deadlock conditions', 8, ['Mutual exclusion, hold and wait, no preemption, circular wait', 'All four must hold at once', 'Break any one condition to prevent deadlock']),
      L('os-m3-l2', "Avoidance with the Banker's algorithm", 13, ['A state is safe if some order lets every process finish', 'Grant a request only if the next state stays safe', 'Compare Need against Available at each step']),
    ],
  },
  {
    id: 'os-m4', title: 'Synchronization',
    lessons: [
      L('os-m4-l1', 'Critical sections and race conditions', 9, ['A race condition depends on unlucky interleaving', 'A critical section must offer mutual exclusion, progress, and bounded waiting', 'Peterson\'s solution works for two processes']),
      L('os-m4-l2', 'Semaphores and monitors', 12, ['wait() decrements and may block; signal() increments and may wake', 'Binary semaphores act as mutexes', 'Monitors bundle data and the procedures that guard it']),
    ],
  },
  {
    id: 'os-m5', title: 'File Systems',
    lessons: [
      L('os-m5-l1', 'Files, directories, and inodes', 9, ['An inode holds metadata and block pointers, not the file name', 'Directories map names to inodes', 'Hard links share an inode; symbolic links point to a path']),
      L('os-m5-l2', 'Allocation methods', 10, ['Contiguous is fast but fragments', 'Linked allocation is poor for random access', 'Indexed allocation gives direct access without external fragmentation']),
    ],
  },
  {
    id: 'os-m6', title: 'I/O Systems',
    lessons: [
      L('os-m6-l1', 'Interrupts and DMA', 8, ['Interrupts let devices signal the CPU asynchronously', 'DMA moves blocks between device and memory without CPU copying', 'The CPU is interrupted once when the transfer completes']),
      L('os-m6-l2', 'Disk scheduling', 11, ['FCFS is fair but wanders; SSTF can starve far requests', 'SCAN sweeps like an elevator; C-SCAN gives uniform waits', 'Total seek distance is the number to compare']),
    ],
  },
];

const autoPoints = (t) => [`What "${t}" means and where it is used`, 'The key terms, syntax or formulas to remember', 'A worked example and the most common mistakes'];

/** mod(courseId, index, title, [[lesson title, minutes], ...]) */
const mod = (cid, i, title, lessons) => ({
  id: `${cid}-m${i}`,
  title,
  lessons: lessons.map(([t, m], j) => L(`${cid}-m${i}-l${j + 1}`, t, m, autoPoints(t))),
});
const build = (cid, spec) => spec.map(([title, lessons], i) => mod(cid, i + 1, title, lessons));

const IMG = {
  os: { from: '#4F46E5', to: '#0F172A', logos: ['linux'] },
  dsa: { from: '#0EA5E9', to: '#4338CA', logos: [] },
  qa: { from: '#F59E0B', to: '#DC2626', logos: [] },
  cn: { from: '#10B981', to: '#0F766E', logos: [] },
  py: { from: '#2563EB', to: '#FACC15', logos: ['python'] },
  java: { from: '#EA580C', to: '#1E3A8A', logos: ['java'] },
  mern: { from: '#059669', to: '#0F172A', logos: ['mongodb', 'express', 'react', 'nodejs'] },
  dbms: { from: '#0284C7', to: '#1E293B', logos: ['mysql', 'postgresql'] },
  web: { from: '#F97316', to: '#7C3AED', logos: ['html5', 'css3', 'javascript'] },
};

const course = (id, name, category, level, hours, description, topics, modules, icon) => ({
  id, name, category, level, hours, description, topics, modules, image: { ...IMG[id], icon }, custom: false,
});

export const COURSES = [
  course('os', 'Operating Systems', 'Core CS', 'Intermediate', 14, 'Understand processes, memory, and the systems behind every application.',
    ['Process Scheduling', 'Memory Management', 'Deadlocks', 'Synchronization', 'File Systems', 'I/O Systems'], OS_MODULES, 'cpu'),
  course('dsa', 'Data Structures & Algorithms', 'Core CS', 'Intermediate', 30, 'Build problem-solving skills with efficient structures and algorithms.',
    ['Arrays & Strings', 'Linked Lists', 'Trees', 'Graphs', 'Sorting & Searching', 'Dynamic Programming'],
    build('dsa', [
      ['Arrays & Strings', [['Arrays and complexity basics', 10], ['Two pointers and sliding window', 14], ['String manipulation patterns', 12]]],
      ['Linked Lists', [['Singly and doubly linked lists', 11], ['Reversal and cycle detection', 13], ['Merge and sort on lists', 10]]],
      ['Trees', [['Binary trees and traversals', 14], ['Binary search trees', 13], ['Heaps and priority queues', 12]]],
      ['Graphs', [['Graph representations', 9], ['BFS and DFS', 15], ['Shortest paths and spanning trees', 16]]],
      ['Sorting & Searching', [['Binary search', 10], ['Merge sort and quick sort', 15], ['Hashing and hash maps', 12]]],
      ['Dynamic Programming', [['Memoisation vs tabulation', 12], ['Classic 1D DP problems', 15], ['Knapsack and LCS', 17]]],
    ]), 'tree'),
  course('qa', 'Quantitative Aptitude', 'Aptitude', 'Beginner', 18, 'Sharpen numerical reasoning, accuracy, and your confidence with numbers.',
    ['Percentages', 'Ratio & Proportion', 'Time & Work', 'Probability', 'Number Series', 'Speed & Distance'],
    build('qa', [
      ['Percentages', [['Percentage basics and shortcuts', 9], ['Successive changes, profit and loss', 12], ['Discount and interest problems', 11]]],
      ['Ratio & Proportion', [['Ratios and proportions', 9], ['Partnerships and mixtures', 12], ['Variation problems', 8]]],
      ['Time & Work', [['Work and efficiency', 10], ['Pipes and cisterns', 9], ['Wages and group work', 8]]],
      ['Probability', [['Counting: permutations and combinations', 13], ['Basic probability', 11], ['Conditional probability', 10]]],
      ['Number Series', [['Arithmetic and geometric series', 8], ['Pattern and mixed series', 10], ['Missing term shortcuts', 7]]],
      ['Speed & Distance', [['Speed, time and distance', 9], ['Trains, boats and streams', 12], ['Relative speed problems', 10]]],
    ]), 'calc'),
  course('cn', 'Computer Networks', 'Core CS', 'Intermediate', 16, 'Connect the dots between protocols, routing, and reliable communication.',
    ['OSI & TCP/IP', 'Routing', 'Transport Layer', 'Application Layer', 'Addressing & Subnetting', 'Network Security'],
    build('cn', [
      ['OSI & TCP/IP', [['OSI model layers', 12], ['TCP/IP model', 9], ['Switching and data link basics', 13]]],
      ['Routing', [['Distance vector and RIP', 11], ['Link state and OSPF', 12], ['BGP and the internet', 10]]],
      ['Transport Layer', [['TCP three-way handshake', 10], ['Flow and congestion control', 14], ['UDP and when to use it', 8]]],
      ['Application Layer', [['HTTP and HTTPS', 11], ['DNS explained', 10], ['Email protocols: SMTP, IMAP, POP3', 9]]],
      ['Addressing & Subnetting', [['IPv4 addressing and classes', 10], ['CIDR and subnet masks', 14], ['IPv6 basics', 9]]],
      ['Network Security', [['Cryptography basics', 12], ['TLS and digital signatures', 11], ['Firewalls and common attacks', 10]]],
    ]), 'network'),
  course('py', 'Python Programming', 'Programming', 'Beginner', 20, 'Learn Python from first principles: syntax, data structures, OOP and real projects.',
    ['Python Basics', 'Control Flow', 'Functions', 'Data Structures', 'OOP', 'Files & Modules'],
    build('py', [
      ['Python Basics', [['Installing Python and running code', 8], ['Variables and data types', 12], ['Operators and input/output', 10]]],
      ['Control Flow', [['if, elif and else', 9], ['for and while loops', 13], ['break, continue and pass', 7]]],
      ['Functions', [['Defining functions', 10], ['Arguments and return values', 12], ['Lambda functions and scope', 11]]],
      ['Data Structures', [['Lists and tuples', 13], ['Dictionaries and sets', 12], ['List comprehensions', 9]]],
      ['OOP', [['Classes and objects', 14], ['Inheritance and polymorphism', 13], ['Dunder methods', 9]]],
      ['Files & Modules', [['Reading and writing files', 10], ['Modules and packages', 9], ['Exceptions and error handling', 11]]],
    ]), 'code'),
  course('java', 'Java Programming', 'Programming', 'Beginner', 24, 'Master core Java, object-oriented design, collections and concurrency.',
    ['Java Basics', 'OOP Concepts', 'Collections', 'Exception Handling', 'Multithreading', 'Java 8 Features'],
    build('java', [
      ['Java Basics', [['JDK, JVM and JRE', 9], ['Data types and operators', 12], ['Control statements and arrays', 14]]],
      ['OOP Concepts', [['Classes, objects and constructors', 13], ['Inheritance and polymorphism', 14], ['Abstraction and interfaces', 12]]],
      ['Collections', [['List and ArrayList', 11], ['Set and Map', 13], ['Iterators and sorting', 10]]],
      ['Exception Handling', [['try, catch and finally', 10], ['Checked vs unchecked exceptions', 9], ['Custom exceptions', 8]]],
      ['Multithreading', [['Threads and Runnable', 12], ['Synchronization', 13], ['Executor framework', 11]]],
      ['Java 8 Features', [['Lambda expressions', 11], ['Streams API', 14], ['Optional and method references', 9]]],
    ]), 'coffee'),
  course('mern', 'MERN Stack Development', 'Web Development', 'Intermediate', 36, 'Build full-stack apps with MongoDB, Express, React and Node.js.',
    ['Node.js Basics', 'Express.js', 'MongoDB', 'React', 'Full-Stack Integration'],
    build('mern', [
      ['Node.js Basics', [['Node runtime, event loop and modules', 12], ['npm and package.json', 8], ['Promises and async/await', 12]]],
      ['Express.js', [['Routing and middleware', 13], ['Designing REST APIs', 14], ['Error handling', 9]]],
      ['MongoDB', [['Documents and collections', 10], ['CRUD and queries', 14], ['Mongoose schemas and models', 13]]],
      ['React', [['Components and props', 12], ['State and hooks', 15], ['Routing and forms', 13]]],
      ['Full-Stack Integration', [['Connecting React to the API', 12], ['JWT authentication', 15], ['Deploying a MERN app', 11]]],
    ]), 'layers'),
  course('dbms', 'Database Management Systems', 'Core CS', 'Intermediate', 18, 'Design, query and optimise relational databases with SQL and transactions.',
    ['ER Model', 'Relational Model & SQL', 'Normalization', 'Transactions & ACID', 'Concurrency Control', 'Indexing'],
    build('dbms', [
      ['ER Model', [['Entities, attributes and relationships', 11], ['ER to relational mapping', 10], ['Keys and constraints', 9]]],
      ['Relational Model & SQL', [['SQL basics: SELECT and WHERE', 12], ['Joins and subqueries', 15], ['Aggregation and GROUP BY', 11]]],
      ['Normalization', [['Functional dependencies', 12], ['1NF, 2NF and 3NF', 14], ['BCNF and denormalisation', 10]]],
      ['Transactions & ACID', [['What is a transaction?', 8], ['ACID properties', 11], ['Isolation levels and anomalies', 12]]],
      ['Concurrency Control', [['Locking and two-phase locking', 13], ['Timestamp ordering', 10], ['Deadlocks in databases', 9]]],
      ['Indexing', [['Indexes and query plans', 11], ['B and B+ trees', 14], ['Hashing and clustering', 9]]],
    ]), 'database'),
  course('web', 'Web Development (HTML, CSS, JS)', 'Web Development', 'Beginner', 22, 'Build modern, responsive websites with HTML, CSS and JavaScript.',
    ['HTML', 'CSS', 'JavaScript', 'DOM & Events', 'Responsive Design', 'Web APIs'],
    build('web', [
      ['HTML', [['HTML structure and semantic tags', 10], ['Forms and inputs', 11], ['Accessibility basics', 8]]],
      ['CSS', [['Selectors and the box model', 12], ['Flexbox', 13], ['CSS Grid', 12]]],
      ['JavaScript', [['Variables, types and functions', 14], ['Arrays and objects', 12], ['ES6+ features', 11]]],
      ['DOM & Events', [['Selecting and changing elements', 11], ['Events and delegation', 12], ['Building a small interactive app', 14]]],
      ['Responsive Design', [['Media queries', 10], ['Mobile-first design', 9], ['Responsive images and units', 8]]],
      ['Web APIs', [['fetch and Promises', 12], ['JSON and REST APIs', 10], ['localStorage and sessionStorage', 8]]],
    ]), 'globe'),
];
