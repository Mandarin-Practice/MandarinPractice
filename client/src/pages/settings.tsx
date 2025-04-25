import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const [difficulty, setDifficulty] = useState<string>("beginner");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoReplay, setAutoReplay] = useState<boolean>(false);
  const [matchStrictness, setMatchStrictness] = useState<string>("moderate");
  const [timeWeight, setTimeWeight] = useState<number>(3);
  const { toast } = useToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const storedDifficulty = localStorage.getItem("difficulty");
    if (storedDifficulty) setDifficulty(storedDifficulty);

    const storedSpeechRate = localStorage.getItem("speechRate");
    if (storedSpeechRate) setSpeechRate(parseFloat(storedSpeechRate));

    const storedAutoReplay = localStorage.getItem("autoReplay");
    if (storedAutoReplay) setAutoReplay(storedAutoReplay === "true");

    const storedMatchStrictness = localStorage.getItem("matchStrictness");
    if (storedMatchStrictness) setMatchStrictness(storedMatchStrictness);

    const storedTimeWeight = localStorage.getItem("timeWeight");
    if (storedTimeWeight) setTimeWeight(parseInt(storedTimeWeight));
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("difficulty", difficulty);
    localStorage.setItem("speechRate", speechRate.toString());
    localStorage.setItem("autoReplay", autoReplay.toString());
    localStorage.setItem("matchStrictness", matchStrictness);
    localStorage.setItem("timeWeight", timeWeight.toString());

    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
      variant: "default",
    });
  };

  // Export user data as JSON file
  const exportData = () => {
    // Gather all user data
    const userData = {
      settings: {
        difficulty,
        speechRate,
        autoReplay,
        matchStrictness,
        timeWeight
      },
      // Additional data can be added here when implementing storage
    };

    // Create a JSON file to download
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = "mandarin-practice-data.json";
    
    // Create a temporary download link
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Data exported",
      description: "Your data has been saved to a JSON file.",
      variant: "default",
    });
  };

  // Import user data from JSON file
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Apply imported settings
        if (data.settings) {
          if (data.settings.difficulty) {
            setDifficulty(data.settings.difficulty);
            localStorage.setItem("difficulty", data.settings.difficulty);
          }
          
          if (data.settings.speechRate) {
            setSpeechRate(data.settings.speechRate);
            localStorage.setItem("speechRate", data.settings.speechRate.toString());
          }
          
          if (data.settings.autoReplay !== undefined) {
            setAutoReplay(data.settings.autoReplay);
            localStorage.setItem("autoReplay", data.settings.autoReplay.toString());
          }
          
          if (data.settings.matchStrictness) {
            setMatchStrictness(data.settings.matchStrictness);
            localStorage.setItem("matchStrictness", data.settings.matchStrictness);
          }
          
          if (data.settings.timeWeight) {
            setTimeWeight(data.settings.timeWeight);
            localStorage.setItem("timeWeight", data.settings.timeWeight.toString());
          }
        }
        
        toast({
          title: "Data imported",
          description: "Your settings have been successfully restored.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The file format is invalid. Please select a proper backup file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = "";
  };

  // Reset all data
  const resetAllData = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      // Clear localStorage
      localStorage.clear();
      
      // Reset settings to defaults
      setDifficulty("beginner");
      setSpeechRate(1.0);
      setAutoReplay(false);
      setMatchStrictness("moderate");
      setTimeWeight(3);
      
      // Clear vocabulary from the server
      apiRequest('DELETE', '/api/vocabulary')
        .then(() => {
          toast({
            title: "Data reset",
            description: "All your data has been cleared.",
            variant: "default",
          });
        })
        .catch((error) => {
          toast({
            title: "Reset failed",
            description: error.message || "There was a problem resetting your data.",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="settings-section">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Practice Settings</CardTitle>
          <CardDescription>Customize your learning experience</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Difficulty Level</h3>
            
            <RadioGroup value={difficulty} onValueChange={setDifficulty} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner">Beginner - Simple sentences with basic grammar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate">Intermediate - More complex structures and vocabulary combinations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced">Advanced - Challenging sentences with advanced grammar patterns</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Audio Settings</h3>
            
            <div className="mb-4">
              <Label htmlFor="speech-rate" className="block text-sm font-medium mb-2">
                Speech Rate
              </Label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Slow</span>
                <Slider
                  id="speech-rate"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={[speechRate]}
                  onValueChange={(values) => setSpeechRate(values[0])}
                  className="flex-1 mx-2"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Fast</span>
              </div>
              <p className="text-xs text-right mt-1 text-gray-500">{speechRate.toFixed(1)}x</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-replay"
                checked={autoReplay}
                onCheckedChange={(checked) => setAutoReplay(checked as boolean)}
              />
              <Label htmlFor="auto-replay">
                Auto-replay audio before showing answer
              </Label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Scoring Settings</h3>
            
            <div className="mb-4">
              <Label htmlFor="match-strictness" className="block text-sm font-medium mb-2">
                Answer Match Strictness
              </Label>
              <select
                id="match-strictness"
                value={matchStrictness}
                onChange={(e) => setMatchStrictness(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary"
              >
                <option value="lenient">Lenient - Focus on key words</option>
                <option value="moderate">Moderate - Balance between exact and meaning</option>
                <option value="strict">Strict - Require close match to correct answer</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="time-weight" className="block text-sm font-medium mb-2">
                Time Weight in Scoring
              </Label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Low</span>
                <Slider
                  id="time-weight"
                  min={1}
                  max={5}
                  step={1}
                  value={[timeWeight]}
                  onValueChange={(values) => setTimeWeight(values[0])}
                  className="flex-1 mx-2"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">High</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How much response speed affects your score
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button onClick={saveSettings}>
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Data Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Export Your Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Download your word lists and progress
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-primary hover:text-blue-700 dark:hover:text-blue-300"
                onClick={exportData}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export Data
                </span>
              </Button>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Import Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Restore from a previous backup
              </p>
              <Label
                htmlFor="import-file"
                className="inline-flex items-center text-sm text-primary hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Import Data
                </span>
              </Label>
              <input
                type="file"
                id="import-file"
                className="hidden"
                accept=".json"
                onChange={importData}
              />
            </div>
          </div>
          
          <div className="mt-6 border border-red-200 dark:border-red-900 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Reset All Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This will delete all your words and progress (cannot be undone)
            </p>
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              onClick={resetAllData}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Reset All Data
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
