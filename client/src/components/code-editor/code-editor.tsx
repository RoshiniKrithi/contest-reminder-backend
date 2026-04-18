import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RotateCcw } from "lucide-react";

export default function CodeEditor() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(`# Your solution here
def solve(arr):
    # Write your algorithm
    return result

# Test cases
print(solve([1, 2, 3, 4, 5]))`);
  const [output, setOutput] = useState(`✓ Test case 1 passed
✓ Test case 2 passed
Expected: [1, 4, 9, 16, 25]`);

  const languages = [
    { value: "python", label: "Python" },
    { value: "cpp", label: "C++" },
    { value: "java", label: "Java" },
    { value: "javascript", label: "JavaScript" },
  ];

  const handleRun = () => {
    setOutput("Running code...");
    // Simulate code execution
    setTimeout(() => {
      setOutput(`✓ Test case 1 passed
✓ Test case 2 passed
✓ All test cases passed!
Execution time: 0.05s`);
    }, 1500);
  };

  const handleClear = () => {
    setOutput("");
  };

  return (
    <Card>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Code Editor
          </h2>
          <div className="flex items-center space-x-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRun} className="bg-secondary hover:bg-secondary/90">
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="bg-gray-900 text-gray-100 p-6 font-mono text-sm overflow-auto code-editor min-h-[300px]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-100 font-mono"
            style={{ minHeight: "250px" }}
            spellCheck={false}
          />
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Console Output:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono text-sm text-gray-900 dark:text-gray-100 min-h-[60px]">
            {output.split('\n').map((line, index) => (
              <div key={index} className={line.startsWith('✓') ? 'text-secondary' : ''}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
