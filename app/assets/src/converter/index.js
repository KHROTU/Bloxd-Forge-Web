import { parseBloxdschem, writeBloxdschem } from "./js/bloxd.js";
import { parseSchem, parseLitematic, writeMinecraft } from "./js/minecraft.js";
import { mcJSONToBloxd, bloxdJSONtoMc } from "./js/json.js";

const downloadBin = function (data, name) {
    const blob = new Blob([data], {
        type: "application/octet-stream"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const error = function (text) {
    const err = new Error(text);
    const statusSection = document.getElementById("status");
    statusSection.className = "status-section error";
    statusSection.innerHTML = text;
    statusSection.style.display = "block";
    throw err;
};

// Get the file input element from HTML
const input = document.getElementById("schematic-file");

// Add event listener to the file input
input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    
    // Show loading state
    const statusSection = document.getElementById("status");
    statusSection.className = "status-section";
    statusSection.innerHTML = '<div style="display: flex; align-items: center; justify-content: center;"><div style="border: 3px solid var(--primary-color); border-radius: 50%; border-top-color: transparent; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-right: 10px;"></div>Converting file...</div>';
    statusSection.style.display = "block";
    
    // Add spin animation
    if (!document.querySelector('style#spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
    
    const split = file.name.split(".");
    const name = split[0];
    const type = split[split.length - 1];

    const fileReader = new FileReader();

    let handler;
    switch(type) {
        case "bloxdschem": handler = bloxdToMinecraft;
            break;
        case "schem": handler = schemToBloxd;
            break;
        case "litematic": handler = litematicToBloxd;
            break;
        case "schematic": 
            statusSection.className = "status-section error";
            statusSection.innerHTML = ".schematic files aren't supported.<br>You may use <a href='https://beta.cubical.xyz/' target='_blank'>https://beta.cubical.xyz/</a> or similar pages to convert to .schem.";
            return;
        default: 
            statusSection.className = "status-section error";
            statusSection.innerHTML = "File type not recognized. Only valid are .schem, .bloxdschem, and .litematic";
            return;
    }

    fileReader.readAsArrayBuffer(file);
    fileReader.addEventListener("load", event => {
        try {
            const data = Buffer.from(event.target.result);
            handler(data, name);
            
            // Show success message
            statusSection.className = "status-section success";
            statusSection.innerHTML = `Successfully converted <strong>${file.name}</strong>. The download should start automatically.`;
        } catch (err) {
            // Show error message
            statusSection.className = "status-section error";
            statusSection.innerHTML = `Error: ${err.message}`;
        }
    });
});

// Add drag and drop functionality
const uploadSection = document.querySelector('.upload-section');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadSection.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    uploadSection.classList.add('highlight');
}

function unhighlight() {
    uploadSection.classList.remove('highlight');
}

uploadSection.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
        input.files = files;
        input.dispatchEvent(new Event('change'));
    }
}

const bloxdToMinecraft = function (buffer, name) {
    const startTime = Date.now();

    const parsed = parseBloxdschem(buffer);
    const mcJson = bloxdJSONtoMc(parsed);
    const mcSchem = writeMinecraft(mcJson);
    const conversionTime = Date.now() - startTime;
    console.log(`Conversion time: ${conversionTime}ms`);

    // Update status with conversion time
    const statusSection = document.getElementById("status");
    statusSection.className = "status-section success";
    statusSection.innerHTML = `Successfully converted to Minecraft schematic in ${conversionTime}ms. The download should start automatically.`;

    downloadBin(mcSchem, `${name}.schem`);
};

const schemToBloxd = async function (buffer, name) {
    const startTime = Date.now();

    const parsed = await parseSchem(buffer);
    const bloxdJson = mcJSONToBloxd(parsed, name);
    const bloxdSchem = writeBloxdschem(bloxdJson);
    const conversionTime = Date.now() - startTime;
    console.log(`Conversion time: ${conversionTime}ms`);

    // Update status with conversion time
    const statusSection = document.getElementById("status");
    statusSection.className = "status-section success";
    statusSection.innerHTML = `Successfully converted to Bloxd schematic in ${conversionTime}ms. The download should start automatically.`;

    downloadBin(bloxdSchem, `${name}.bloxdschem`);
};

const litematicToBloxd = async function (buffer, name) {
    const startTime = Date.now();

    const parsed = await parseLitematic(buffer);
    const bloxdJson = mcJSONToBloxd(parsed, name);
    const bloxdSchem = writeBloxdschem(bloxdJson);
    const conversionTime = Date.now() - startTime;
    console.log(`Conversion time: ${conversionTime}ms`);

    // Update status with conversion time
    const statusSection = document.getElementById("status");
    statusSection.className = "status-section success";
    statusSection.innerHTML = `Successfully converted to Bloxd schematic in ${conversionTime}ms. The download should start automatically.`;

    downloadBin(bloxdSchem, `${name}.bloxdschem`);
};