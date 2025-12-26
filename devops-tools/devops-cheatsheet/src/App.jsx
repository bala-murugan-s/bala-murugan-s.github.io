import { useState, useEffect } from 'react';
import { Search, Copy, Check, AlertTriangle, Zap, Terminal, ChevronDown, ChevronUp, Book, FileText } from 'lucide-react';

const App = () => {
  const [tools, setTools] = useState([]);
  const [activeTab, setActiveTab] = useState('Terraform');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCommand, setCopiedCommand] = useState('');
  const [expandedCommands, setExpandedCommands] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all tool data from JSON files
  useEffect(() => {
    const loadTools = async () => {
      try {
        const toolNames = ['terraform', 'ansible', 'kubernetes', 'docker', 'github', 'jenkins'];
        
        const loadedTools = await Promise.all(
          toolNames.map(async (name) => {
            try {
              const response = await fetch(`/data/${name}.json`);
              if (!response.ok) throw new Error(`Failed to load ${name}`);
              return await response.json();
            } catch (err) {
              console.warn(`Could not load ${name}.json:`, err.message);
              return null;
            }
          })
        );
        
        // Filter out failed loads
        const validTools = loadedTools.filter(tool => tool !== null);
        
        if (validTools.length === 0) {
          setError('No tool data could be loaded. Please check your data files.');
        } else {
          setTools(validTools);
          // Set first available tool as active
          if (validTools.length > 0) {
            setActiveTab(validTools[0].tool);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading tools:', err);
        setError('Failed to load tool data. Please check console for details.');
        setLoading(false);
      }
    };
    
    loadTools();
  }, []);

  const activeToolData = tools.find(t => t.tool === activeTab);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    setTimeout(() => setCopiedCommand(''), 2000);
  };

  const toggleCommand = (commandId) => {
    setExpandedCommands(prev => ({
      ...prev,
      [commandId]: !prev[commandId]
    }));
  };

  const filterCommands = (categories) => {
    if (!searchQuery) return categories;
    
    return categories.map(category => ({
      ...category,
      commands: category.commands.filter(cmd =>
        cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })).filter(category => category.commands.length > 0);
  };

  const getDangerBg = (level) => {
    switch(level) {
      case 'safe': return 'bg-green-500/10 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'danger': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Terminal className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 text-lg">Loading DevOps commands...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-200 mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Make sure JSON files exist in /public/data/ folder</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DevOps Command Hub
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Book className="w-4 h-4" />
              <span>Quick Reference & Cheat Sheets</span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search commands, descriptions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Tool Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {tools.map(tool => (
              <button
                key={tool.tool}
                onClick={() => setActiveTab(tool.tool)}
                className={`px-6 py-3 rounded-t-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tool.tool
                    ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                    : 'bg-gray-800/30 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                {tool.tool}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeToolData && filterCommands(activeToolData.categories).map((category, catIndex) => (
          <div key={catIndex} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-100">
              <span className="text-2xl">{category.icon}</span>
              {category.name}
            </h2>
            
            <div className="space-y-4">
              {category.commands.map((cmd, cmdIndex) => {
                const commandId = `${catIndex}-${cmdIndex}`;
                const isExpanded = expandedCommands[commandId];
                
                return (
                  <div
                    key={cmdIndex}
                    className={`border rounded-lg overflow-hidden transition-all ${getDangerBg(cmd.danger)}`}
                  >
                    {/* Command Header */}
                    <div className="p-4 bg-gray-800/40">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <code className="text-lg font-mono text-blue-300 bg-gray-900/50 px-3 py-1 rounded break-all">
                              {cmd.command}
                            </code>
                            <button
                              onClick={() => copyToClipboard(cmd.command)}
                              className="p-2 hover:bg-gray-700/50 rounded transition-colors flex-shrink-0"
                              title="Copy command"
                            >
                              {copiedCommand === cmd.command ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          
                          <p className="text-gray-300 mb-2">{cmd.description}</p>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            <span>{cmd.usage}</span>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {cmd.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                              cmd.danger === 'safe' ? 'bg-green-500/20 text-green-300' :
                              cmd.danger === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {cmd.danger === 'danger' && <AlertTriangle className="w-3 h-3" />}
                              {cmd.danger}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleCommand(commandId)}
                          className="p-2 hover:bg-gray-700/50 rounded transition-colors flex-shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-700/50 bg-gray-900/30">
                        {/* Flags */}
                        {cmd.flags && cmd.flags.length > 0 && (
                          <div className="p-4 border-b border-gray-700/50">
                            <h4 className="font-semibold mb-2 text-gray-200 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Common Flags
                            </h4>
                            <div className="space-y-2">
                              {cmd.flags.map((flag, i) => (
                                <div key={i} className="flex gap-3 flex-wrap">
                                  <code className="text-purple-300 font-mono text-sm bg-gray-800/50 px-2 py-1 rounded">
                                    {flag.flag}
                                  </code>
                                  <span className="text-gray-400 text-sm">{flag.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Example Output */}
                        <div className="p-4">
                          <h4 className="font-semibold mb-2 text-gray-200 flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            Example Output
                          </h4>
                          <pre className="bg-gray-950/50 p-4 rounded-lg overflow-x-auto text-sm text-green-400 font-mono border border-gray-800 whitespace-pre-wrap">
{cmd.example_output}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Results */}
        {activeToolData && filterCommands(activeToolData.categories).length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No commands found matching "{searchQuery}"</p>
            <p className="text-sm mt-2">Try different keywords or clear the search</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>💡 Pro Tip: Click any command card to expand details, flags, and example output</p>
          <p className="mt-2">Built for DevOps engineers who need quick, reliable command references</p>
        </div>
      </footer>
    </div>
  );
};

export default App;