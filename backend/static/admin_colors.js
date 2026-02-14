// static/admin_colors.js
document.addEventListener("DOMContentLoaded", function() {
    // 1. Find all radio inputs used for the 'color_code' field
    const radios = document.querySelectorAll('input[type="radio"][name="color_code"]');
    
    radios.forEach(radio => {
        // 2. Get the hex color value (e.g., "#FF3B6B")
        const color = radio.value;
        
        // 3. Find the parent <label> tag (which contains the text)
        const label = radio.closest('label');
        
        if (label && color) {
            // 4. Apply styling to make it look like a Color Chip
            label.style.backgroundColor = color;
            label.style.color = "#ffffff"; // White text
            label.style.padding = "8px 15px";
            label.style.margin = "5px";
            label.style.borderRadius = "20px";
            label.style.display = "inline-block";
            label.style.cursor = "pointer";
            label.style.fontWeight = "bold";
            label.style.border = "2px solid transparent";
            label.style.textShadow = "0px 0px 2px rgba(0,0,0,0.5)";
            
            // 5. Add a click effect (Border highlight)
            radio.addEventListener('change', updateBorders);
        }
    });

    // Helper to update borders when selection changes
    function updateBorders() {
        radios.forEach(r => {
            const lbl = r.closest('label');
            if (r.checked) {
                lbl.style.borderColor = "#333"; // Dark border for selected
                lbl.style.boxShadow = "0 0 8px rgba(0,0,0,0.4)";
                lbl.style.transform = "scale(1.05)";
            } else {
                lbl.style.borderColor = "transparent";
                lbl.style.boxShadow = "none";
                lbl.style.transform = "scale(1)";
            }
        });
    }

    // Run once on load to highlight the currently selected color
    updateBorders();
});