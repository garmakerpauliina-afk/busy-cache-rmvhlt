import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  ListTodo, 
  BarChart2, 
  Timer, 
  Smile, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  Activity,
  Calendar,
  Palette,
  LayoutGrid
} from 'lucide-react';

// --- 工具函数 ---
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dates;
};

const TASK_COLORS = [
  { id: 'blue', bg: 'bg-sky-200', text: 'text-sky-700' },
  { id: 'green', bg: 'bg-teal-200', text: 'text-teal-700' },
  { id: 'red', bg: 'bg-rose-200', text: 'text-rose-700' },
  { id: 'purple', bg: 'bg-fuchsia-200', text: 'text-fuchsia-700' },
  { id: 'amber', bg: 'bg-amber-200', text: 'text-amber-700' },
  { id: 'pink', bg: 'bg-pink-200', text: 'text-pink-700' },
  { id: 'gray', bg: 'bg-stone-200', text: 'text-stone-700' }
];

const HEATMAP_SHADES = {
  blue: ['bg-sky-100', 'bg-sky-300', 'bg-sky-500'],
  green: ['bg-teal-100', 'bg-teal-300', 'bg-teal-500'],
  red: ['bg-rose-100', 'bg-rose-300', 'bg-rose-500'],
  purple: ['bg-fuchsia-100', 'bg-fuchsia-300', 'bg-fuchsia-500'],
  amber: ['bg-amber-100', 'bg-amber-300', 'bg-amber-500'],
  pink: ['bg-pink-100', 'bg-pink-300', 'bg-pink-500'],
  gray: ['bg-stone-200', 'bg-stone-400', 'bg-stone-600']
};

const TASK_ICONS = ['📌', '⭐', '🏃', '📚', '💧', '🧘', '💻', '🧹', '🎨', '💊', '🍎', '💰'];

// --- 自定义 Hook: LocalStorage ---
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, weekly, stats, pomodoro, poop

  // --- 状态管理 ---
  const [tasks, setTasks] = useLocalStorage('life_tasks', []);
  const [completions, setCompletions] = useLocalStorage('life_completions', {}); // { 'YYYY-MM-DD': ['taskId1', 'taskId2'] }
  const [poops, setPoops] = useLocalStorage('life_poops', []);

  const todayStr = getTodayString();

  // --- 任务计划模块逻辑 ---
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskColor, setNewTaskColor] = useState('blue');
  const [newTaskIcon, setNewTaskIcon] = useState('📌');
  const [showCustomizer, setShowCustomizer] = useState(false);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      category: newTaskCategory.trim() || '默认',
      color: newTaskColor,
      icon: newTaskIcon,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewTaskCategory('');
    setNewTaskColor('blue');
    setNewTaskIcon('📌');
    setShowCustomizer(false);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTaskCompletion = (taskId) => {
    setCompletions(prev => {
      const todayCompletions = prev[todayStr] || [];
      const isCompleted = todayCompletions.includes(taskId);
      
      let newTodayCompletions;
      if (isCompleted) {
        newTodayCompletions = todayCompletions.filter(id => id !== taskId);
      } else {
        newTodayCompletions = [...todayCompletions, taskId];
      }
      
      return { ...prev, [todayStr]: newTodayCompletions };
    });
  };

  // --- 番茄钟模块逻辑 ---
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); // work, break
  const timerRef = useRef(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            // 自动切换模式
            if (timerMode === 'work') {
              setTimerMode('break');
              return 5 * 60;
            } else {
              setTimerMode('work');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timerMode]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMode === 'work' ? 25 * 60 : 5 * 60);
  };
  const switchTimerMode = (mode) => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  // --- 粑粑记录模块逻辑 ---
  const [poopDuration, setPoopDuration] = useState(5);
  const [poopHealth, setPoopHealth] = useState(3); // 1-4 scale
  const [poopAmount, setPoopAmount] = useState('medium'); 
  const [poopFeeling, setPoopFeeling] = useState('normal'); 
  const [poopSeconds, setPoopSeconds] = useState(0);
  const [isPoopTiming, setIsPoopTiming] = useState(false);
  const poopTimerRef = useRef(null);
  
  const healthTypes = [
    { level: 1, icon: '🪨', label: '干硬颗粒', desc: '便秘' },
    { level: 2, icon: '🍌', label: '香蕉状', desc: '完美健康' },
    { level: 3, icon: '🍦', label: '软泥状', desc: '偏稀' },
    { level: 4, icon: '💧', label: '水状', desc: '腹泻' },
  ];

  const amountTypes = [
    { id: 'small', label: '偏少', icon: '🤏' },
    { id: 'medium', label: '正常', icon: '👌' },
    { id: 'large', label: '超多', icon: '🏔️' },
  ];

  const feelingTypes = [
    { id: 'easy', label: '丝滑顺畅', icon: '😌' },
    { id: 'normal', label: '普普通通', icon: '😐' },
    { id: 'hard', label: '十分费力', icon: '😫' },
  ];

  const addPoopLog = () => {
    const newPoop = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: poopDuration,
      health: poopHealth,
      amount: poopAmount,
      feeling: poopFeeling
    };
    setPoops([newPoop, ...poops]);
  };

  const deletePoopLog = (id) => {
    setPoops(poops.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (isPoopTiming) {
      poopTimerRef.current = setInterval(() => {
        setPoopSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(poopTimerRef.current);
    }
    return () => clearInterval(poopTimerRef.current);
  }, [isPoopTiming]);

  const togglePoopTimer = () => setIsPoopTiming(!isPoopTiming);
  
  const stopAndSavePoopTimer = () => {
    setIsPoopTiming(false);
    // 换算成基于分钟的时长，不足1分钟算1分钟
    const calculatedDuration = Math.max(1, Math.round(poopSeconds / 60));
    setPoopDuration(calculatedDuration);
    setPoopSeconds(0);
  };


  // --- 渲染子组件 ---

  const renderTasks = () => {
    const todayCompletions = completions[todayStr] || [];
    
    // 按分类分组
    const groupedTasks = tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <Plus className="text-blue-500" size={24} /> 新建计划
          </h2>
          <form onSubmit={addTask} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="计划名称 (如: 跑步5公里)" 
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="分类 (如: 运动)" 
                className="sm:w-32 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowCustomizer(!showCustomizer)}
                className={`p-3 border rounded-xl transition-colors flex items-center justify-center ${showCustomizer ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title="自定义图标和颜色"
              >
                <Palette size={20} />
              </button>
              <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                添加 <Plus size={18} />
              </button>
            </div>
            
            {showCustomizer && (
              <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-10">图标:</span>
                  <div className="flex flex-wrap gap-2">
                    {TASK_ICONS.map(icon => (
                      <button 
                        key={icon} 
                        type="button"
                        onClick={() => setNewTaskIcon(icon)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${newTaskIcon === icon ? 'bg-white shadow-sm ring-2 ring-blue-500 scale-110' : 'hover:bg-gray-200 hover:scale-110 grayscale-[50%]'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-10">颜色:</span>
                  <div className="flex flex-wrap gap-3 pl-1">
                    {TASK_COLORS.map(c => (
                      <button 
                        key={c.id} 
                        type="button"
                        onClick={() => setNewTaskColor(c.id)}
                        className={`w-6 h-6 rounded-full ${c.bg} shadow-inner transition-all ${newTaskColor === c.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {Object.entries(groupedTasks).map(([category, catTasks]) => (
          <div key={category} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div> {category}
            </h3>
            <div className="space-y-2">
              {catTasks.map(task => {
                const isDone = todayCompletions.includes(task.id);
                const taskColorObj = TASK_COLORS.find(c => c.id === (task.color || 'blue')) || TASK_COLORS[0];
                const taskIcon = task.icon || '📌';
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <button 
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isDone ? (
                        <div className={`w-6 h-6 rounded-full ${taskColorObj.bg} shrink-0 shadow-inner`}></div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 shrink-0"></div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-gray-100 grayscale opacity-50' : taskColorObj.bg} transition-all`}>
                        <span className={isDone ? 'opacity-50' : ''}>{taskIcon}</span>
                      </div>
                      <span className={`text-base font-medium transition-all ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {task.name}
                      </span>
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
            <p>还没有任何计划，赶紧创建一个吧！</p>
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    const days = getLastNDays(84); // 过去12周 (84天)
    
    // 获取当天的主要颜色
    const getDominantColor = (taskIds) => {
      if (!taskIds || taskIds.length === 0) return 'green';
      const colorCounts = {};
      let maxColor = 'green';
      let maxCount = 0;

      taskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        const color = task?.color || 'blue';
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        if (colorCounts[color] > maxCount) {
          maxCount = colorCounts[color];
          maxColor = color;
        }
      });
      return maxColor;
    };

    // 获取全局主要颜色用于图例
    const getOverallDominantColor = () => {
      if (tasks.length === 0) return 'green';
      const colorCounts = {};
      let maxColor = 'green';
      let maxCount = 0;
      tasks.forEach(task => {
        const c = task.color || 'blue';
        colorCounts[c] = (colorCounts[c] || 0) + 1;
        if (colorCounts[c] > maxCount) {
          maxCount = colorCounts[c];
          maxColor = c;
        }
      });
      return maxColor;
    };

    // 生成热力图颜色
    const getColor = (dateStr) => {
      const taskIds = completions[dateStr] || [];
      const count = taskIds.length;
      if (count === 0) return 'bg-gray-100';

      const dominantColor = getDominantColor(taskIds);
      const shades = HEATMAP_SHADES[dominantColor] || HEATMAP_SHADES.green;
      
      if (count <= 2) return shades[0];
      if (count <= 4) return shades[1];
      return shades[2];
    };

    const legendColor = getOverallDominantColor();
    const legendShades = HEATMAP_SHADES[legendColor] || HEATMAP_SHADES.green;

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Activity className="text-green-500" size={24} /> 计划热力图 (近12周)
          </h2>
          
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
              {days.map(dateStr => (
                <div 
                  key={dateStr} 
                  title={`${dateStr}: 完成 ${completions[dateStr]?.length || 0} 项`}
                  className={`w-4 h-4 rounded-sm ${getColor(dateStr)} transition-all hover:ring-2 ring-gray-400 ring-offset-1`}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 justify-end">
            <span>少</span>
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className={`w-3 h-3 ${legendShades[0]} rounded-sm`}></div>
            <div className={`w-3 h-3 ${legendShades[1]} rounded-sm`}></div>
            <div className={`w-3 h-3 ${legendShades[2]} rounded-sm`}></div>
            <span>多</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPomodoro = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = timerMode === 'work' 
      ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
      : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-8 animate-in fade-in">
        <div className="flex bg-gray-100 p-1 rounded-full w-full max-w-xs">
          <button 
            onClick={() => switchTimerMode('work')}
            className={`flex-1 py-2 rounded-full font-medium transition-all ${timerMode === 'work' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500'}`}
          >
            工作 (25分)
          </button>
          <button 
            onClick={() => switchTimerMode('break')}
            className={`flex-1 py-2 rounded-full font-medium transition-all ${timerMode === 'break' ? 'bg-white shadow-sm text-green-500' : 'text-gray-500'}`}
          >
            休息 (5分)
          </button>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90">
            <circle 
              cx="128" cy="128" r="120" 
              className="stroke-gray-100" strokeWidth="8" fill="none" 
            />
            <circle 
              cx="128" cy="128" r="120" 
              className={`transition-all duration-1000 ease-linear ${timerMode === 'work' ? 'stroke-red-500' : 'stroke-green-500'}`} 
              strokeWidth="8" fill="none" 
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-6xl font-black text-gray-800 tracking-tighter">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTimer}
            className={`w-16 h-16 flex items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 ${timerMode === 'work' ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {isTimerRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button 
            onClick={resetTimer}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderPoopTracker = () => {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Smile className="text-amber-600" size={24} /> 新增粑粑记录
          </h2>
          
          <div className="space-y-6">
            <div className="bg-amber-50 rounded-xl p-6 flex flex-col items-center justify-center border border-amber-100 relative overflow-hidden">
              <div className="text-5xl font-black text-amber-800 mb-4 tracking-tighter">
                {String(Math.floor(poopSeconds / 60)).padStart(2, '0')}:{String(poopSeconds % 60).padStart(2, '0')}
              </div>
              <div className="flex gap-4 z-10">
                <button 
                  onClick={togglePoopTimer}
                  className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 ${isPoopTiming ? 'bg-amber-600' : 'bg-amber-500'}`}
                >
                  {isPoopTiming ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>
                {(poopSeconds > 0 || isPoopTiming) && (
                  <button 
                    onClick={stopAndSavePoopTimer}
                    className="px-4 h-12 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center shadow-md hover:bg-amber-800 transition-colors"
                  >
                    停止并同步时长
                  </button>
                )}
              </div>
              <p className="text-sm text-amber-600 mt-4 text-center z-10">点击播放开始如厕计时，结束后点击同步自动填入下方</p>
              
              {/* 装饰性背景 */}
              <div className={`absolute -bottom-6 -right-6 text-amber-200 opacity-20 transition-transform duration-1000 ${isPoopTiming ? 'scale-125 animate-pulse' : 'scale-100'}`}>
                <Timer size={140} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排泄时长: {poopDuration} 分钟</label>
              <input 
                type="range" 
                min="1" max="30" 
                value={poopDuration} 
                onChange={(e) => setPoopDuration(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">健康程度 (布里斯托分类)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {healthTypes.map(type => (
                  <button
                    key={type.level}
                    onClick={() => setPoopHealth(type.level)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${poopHealth === type.level ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-amber-200'}`}
                  >
                    <span className="text-3xl">{type.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{type.label}</span>
                    <span className="text-xs text-gray-500">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">粑粑量</label>
                <div className="flex gap-2">
                  {amountTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setPoopAmount(type.id)}
                      className={`flex-1 py-3 px-1 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${poopAmount === type.id ? 'border-amber-500 bg-amber-50 shadow-sm scale-105' : 'border-gray-100 hover:border-amber-200'}`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-xs font-medium text-gray-800">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">如厕感受</label>
                <div className="flex gap-2">
                  {feelingTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setPoopFeeling(type.id)}
                      className={`flex-1 py-3 px-1 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${poopFeeling === type.id ? 'border-amber-500 bg-amber-50 shadow-sm scale-105' : 'border-gray-100 hover:border-amber-200'}`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-xs font-medium text-gray-800">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={addPoopLog}
              className="w-full bg-amber-600 text-white p-4 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-sm"
            >
              保存记录 💩
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4">历史记录</h3>
          {poops.length === 0 ? (
            <p className="text-gray-400 text-center py-4">还没有记录哦~</p>
          ) : (
            <div className="space-y-3">
              {poops.map(poop => {
                const date = new Date(poop.date);
                const health = healthTypes.find(h => h.level === poop.health);
                const amount = amountTypes.find(a => a.id === (poop.amount || 'medium'));
                const feeling = feelingTypes.find(f => f.id === (poop.feeling || 'normal'));
                return (
                  <div key={poop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0">
                        {health?.icon}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                          {health?.label} 
                          <span className="text-xs font-normal text-gray-600 bg-amber-100/50 px-2 py-0.5 rounded-full border border-amber-100/50">{amount?.icon} {amount?.label}</span>
                          <span className="text-xs font-normal text-gray-600 bg-amber-100/50 px-2 py-0.5 rounded-full border border-amber-100/50">{feeling?.icon} {feeling?.label}</span>
                          <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{poop.duration} 分钟</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar size={14} /> 
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deletePoopLog(poop.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeeklyWidget = () => {
    const last7Days = getLastNDays(7).reverse(); // 把今天放在最后面
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <LayoutGrid className="text-purple-500" size={24} /> 桌面小组件预览 (本周打卡)
          </h2>
          
          <div className="bg-gray-50/50 rounded-2xl p-4 md:p-6 border border-gray-100 overflow-x-auto">
            <div className="min-w-[500px]">
              {/* 表头 (日期) */}
              <div className="flex mb-4">
                <div className="w-32 shrink-0"></div>
                {last7Days.map(dateStr => {
                  const d = new Date(dateStr);
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={dateStr} className="flex-1 flex flex-col items-center justify-center gap-1">
                      <span className={`text-xs font-bold ${isToday ? 'text-purple-600' : 'text-gray-400'}`}>
                        周{dayNames[d.getDay()]}
                      </span>
                      <span className={`text-sm ${isToday ? 'bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-md' : 'text-gray-600 font-medium'}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 任务列表 */}
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">暂无计划，请先创建</p>
                ) : (
                  tasks.map(task => {
                    const taskColorObj = TASK_COLORS.find(c => c.id === (task.color || 'blue')) || TASK_COLORS[0];
                    return (
                      <div key={task.id} className="flex items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-32 shrink-0 flex items-center gap-3 pr-2 border-r border-gray-100">
                          <span className="text-xl bg-gray-50 w-8 h-8 rounded-lg flex items-center justify-center">{task.icon || '📌'}</span>
                          <span className="text-sm font-bold text-gray-700 truncate" title={task.name}>{task.name}</span>
                        </div>
                        {last7Days.map(dateStr => {
                          const isDone = (completions[dateStr] || []).includes(task.id);
                          return (
                            <div key={dateStr} className="flex-1 flex justify-center">
                              <button 
                                onClick={() => toggleTaskCompletion(task.id)} // 允许直接在概览中点击打卡/取消
                                className={`w-8 h-8 rounded-xl transition-all ${isDone ? taskColorObj.bg + ' shadow-inner scale-110' : 'bg-transparent border-2 border-gray-100 hover:border-gray-200'}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center bg-gray-50 p-3 rounded-xl">
            💡 提示：这是一个模拟安卓桌面小组件外观的“本周视图”。在开发真实的安卓手机APP时，你可以使用 React Native 将这个UI直接贴在手机桌面上！
          </p>
        </div>
      </div>
    );
  };

  // --- 主渲染 ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 md:pb-0 md:pl-64">
      {/* 侧边栏/底部导航 */}
      <nav className="fixed bottom-0 w-full md:w-64 md:h-screen md:left-0 bg-white border-t md:border-t-0 md:border-r border-gray-200 z-50 flex md:flex-col shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="hidden md:flex items-center gap-3 px-8 py-8 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">LifeTracker</h1>
        </div>
        
        <div className="flex md:flex-col w-full px-2 py-2 md:py-6 md:px-4 gap-1 md:gap-2 overflow-x-auto no-scrollbar">
          <NavItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<ListTodo size={22} />} label="打卡" color="blue" />
          <NavItem active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} icon={<LayoutGrid size={22} />} label="本周" color="purple" />
          <NavItem active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart2 size={22} />} label="热力图" color="green" />
          <NavItem active={activeTab === 'pomodoro'} onClick={() => setActiveTab('pomodoro')} icon={<Timer size={22} />} label="番茄钟" color="red" />
          <NavItem active={activeTab === 'poop'} onClick={() => setActiveTab('poop')} icon={<Smile size={22} />} label="粑粑" color="amber" />
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto p-4 md:p-8 pt-8">
        <header className="mb-8 md:hidden">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            LifeTracker
          </h1>
        </header>

        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'weekly' && renderWeeklyWidget()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'pomodoro' && renderPomodoro()}
        {activeTab === 'poop' && renderPoopTracker()}
      </main>
    </div>
  );
}

// 导航项组件
function NavItem({ active, onClick, icon, label, color }) {
  const colorClasses = {
    blue: active ? 'bg-sky-100 text-sky-700' : 'hover:bg-gray-50 text-gray-600 hover:text-sky-600',
    green: active ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-50 text-gray-600 hover:text-teal-600',
    red: active ? 'bg-rose-100 text-rose-700' : 'hover:bg-gray-50 text-gray-600 hover:text-rose-600',
    amber: active ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-50 text-gray-600 hover:text-amber-600',
    purple: active ? 'bg-fuchsia-100 text-fuchsia-700' : 'hover:bg-gray-50 text-gray-600 hover:text-fuchsia-600',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 py-3 md:py-4 px-2 md:px-4 rounded-xl md:rounded-2xl transition-all ${colorClasses[color]}`}
    >
      <span className={active ? 'scale-110 transition-transform duration-300' : ''}>{icon}</span>
      <span className={`text-[10px] md:text-sm font-bold ${active ? '' : 'font-medium'}`}>{label}</span>
    </button>
  );
}