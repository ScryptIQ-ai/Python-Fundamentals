// Generalisable Pyodide Initialisation Script
// Variables and state build up naturally as code blocks execute in order

async function main() {
    // Show loading message for all output elements
    document.querySelectorAll(".output").forEach(el => {
        el.textContent = "Loading Pyodide...";
        el.classList.add("loading-message");
    });
    
    try {
        // Load Pyodide
        console.log("Loading Pyodide...");
        let pyodide = await loadPyodide();
        
        // Only set up basic Python environment - no pre-loaded variables
        await pyodide.runPythonAsync(`
            import sys
            from io import StringIO
        `);
        
        console.log("Pyodide loaded successfully");
        
        // Load remote files if URLs are specified
        const lessonFiles = window.LESSON_FILES || [];
        
        if (lessonFiles.length > 0) {
            try {
                console.log(`Checking for ${lessonFiles.length} remote file(s) to load...`);
                
                // Build Python code to load all files dynamically
                let pythonCode = `
from pyodide.http import pyfetch
import os

# Create data directory if it doesn't exist
os.makedirs('./data', exist_ok=True)
`;
                
                // Add loading code for each file
                for (const file of lessonFiles) {
                    pythonCode += `
# Load ${file.filename}
try:
    response = await pyfetch("${file.url}")
    content = await response.string()
    with open('./data/${file.filename}', 'w') as f:
        f.write(content)
    print("Loaded: ${file.filename}")
except Exception as e:
    print(f"Could not load ${file.filename}: {e}")
`;
                }
                
                await pyodide.runPythonAsync(pythonCode);
                console.log("Remote files loaded successfully");
            } catch (error) {
                console.warn("Error loading remote files (continuing anyway):", error);
            }
        } else {
            console.log("No remote files to load for this lesson");
        }
        
        // Function to execute Python code and capture output
        async function executePythonCode(code) {
            try {
                // Redirect Python stdout to capture print statements
                await pyodide.runPythonAsync(`
                    old_stdout = sys.stdout
                    sys.stdout = mystdout = StringIO()
                `);
                
                // Run the user code
                const result = await pyodide.runPythonAsync(code);
                
                // Get the captured stdout
                const stdout = await pyodide.runPythonAsync(`
                    sys.stdout = old_stdout
                    mystdout.getvalue()
                `);
                
                // Combine stdout and result
                let output = stdout;
                if (result !== undefined && result !== null && String(result).trim() !== '') {
                    if (output) output += "\n";
                    output += String(result);
                }
                
                return { success: true, output: output || "Code executed successfully (no output)" };
                
            } catch (error) {
                return { success: false, output: "Error: " + error.message };
            }
        }
        
        // Execute all hidden code blocks first (for setup code like imports)
        const hiddenCodeBlocks = Array.from(document.querySelectorAll('.hidden-code textarea'));
        console.log(`Found ${hiddenCodeBlocks.length} hidden code blocks`);

        for (const textarea of hiddenCodeBlocks) {
            const code = textarea.value.trim();
            if (!code) continue;
            
            console.log(`Executing hidden code block: ${textarea.id}`);
            const result = await executePythonCode(code);
            
            if (!result.success) {
                console.error(`Error in hidden code block ${textarea.id}:`, result.output);
            } else {
                console.log(`Hidden code block ${textarea.id} executed successfully`);
            }
        }

        console.log("All hidden code blocks executed");
        
        // Get all fixed code blocks in document order
        const fixedCodeBlocks = Array.from(document.querySelectorAll('.code-fixed textarea'));
        
        // Setup and execute fixed code blocks sequentially
        for (const textarea of fixedCodeBlocks) {
            const code = textarea.value.trim();
            if (!code) continue;
            
            // Set up CodeMirror editor (read-only)
            const editor = CodeMirror.fromTextArea(textarea, {
                mode: "python",
                theme: "pastel-on-dark",
                lineNumbers: true,
                readOnly: true,
                viewportMargin: Infinity
            });
            
            // Find corresponding output element
            const outputId = textarea.id + '-output';
            const outputElement = document.getElementById(outputId);
            
            if (outputElement) {
                outputElement.textContent = "Running code...";
                outputElement.classList.add("loading-message");
                
                // Execute the code (this maintains state for subsequent blocks)
                const result = await executePythonCode(code);
                
                outputElement.textContent = result.output;
                outputElement.classList.remove("loading-message");
                if (result.success) {
                    outputElement.classList.add("success-message");
                    outputElement.classList.remove("error-message");
                } else {
                    outputElement.classList.add("error-message");
                    outputElement.classList.remove("success-message");
                }
            }
            
            // Small delay to show progression
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Setup all editable code blocks (but don't execute them)
        document.querySelectorAll('.code-editor textarea').forEach((textarea) => {
            // Set up CodeMirror editor (editable)
            const editor = CodeMirror.fromTextArea(textarea, {
                mode: "python",
                theme: "pastel-on-dark",
                lineNumbers: true,
                viewportMargin: Infinity
            });
            
            // Find corresponding run button and output element
            const baseId = textarea.id;
            const runButtonId = 'run-' + baseId;
            const outputId = baseId + '-output';
            
            const runButton = document.getElementById(runButtonId);
            const outputElement = document.getElementById(outputId);
            
            if (runButton && outputElement) {
                // Set initial state
                outputElement.textContent = "Ready to run code!";
                outputElement.classList.remove("loading-message");
                
                runButton.addEventListener("click", async () => {
                    const code = editor.getValue().trim();
                    if (!code) {
                        outputElement.textContent = "No code to run";
                        return;
                    }
                    
                    outputElement.textContent = "Running...";
                    outputElement.classList.remove("error-message", "success-message");
                    outputElement.classList.add("loading-message");
                    
                    // Execute the code (this also maintains state for future blocks)
                    const result = await executePythonCode(code);
                    
                    outputElement.textContent = result.output;
                    outputElement.classList.remove("loading-message");
                    if (result.success) {
                        outputElement.classList.add("success-message");
                        outputElement.classList.remove("error-message");
                    } else {
                        outputElement.classList.add("error-message");
                        outputElement.classList.remove("success-message");
                    }
                });
            }
        });
        
        console.log("All code blocks initialised successfully");
        
    } catch (error) {
        console.error("Failed to initialise Pyodide:", error);
        document.querySelectorAll(".output").forEach(el => {
            el.textContent = "Error loading Pyodide: " + error.message;
            el.classList.remove("loading-message");
            el.classList.add("error-message");
        });
    }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}