import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { hexToHsl, hslToHex } from "@/lib/colors";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setInputValue(color);
  }, [color]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue);
    }
  };
  
  const predefinedColors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#F43F5E", // Red
    "#F97316", // Orange
    "#FACC15", // Yellow
    "#64748B", // Gray
  ];
  
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-3 relative">
        <div
          className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-600 cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => setShowPicker(!showPicker)}
        ></div>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="block w-full max-w-[120px]"
          maxLength={7}
        />
        
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-10"
          >
            <div className="grid grid-cols-7 gap-2">
              {predefinedColors.map((presetColor) => (
                <div
                  key={presetColor}
                  className="w-6 h-6 rounded-full cursor-pointer border border-neutral-300 dark:border-neutral-600"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor);
                    setInputValue(presetColor);
                    setShowPicker(false);
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
