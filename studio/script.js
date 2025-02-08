let writeTextArea = document.getElementById("write-text-area");
writeTextArea.onclick = openTextEditor;

function openTextEditor() {
    let textEditor = document.createElement("div");
    textEditor.id = "text-editor";
    textEditor.style.position = "fixed";
    textEditor.style.top = "50%";
    textEditor.style.left = "50%";
    textEditor.style.transform = "translate(-50%, -50%)";
    textEditor.style.width = "500px";
    textEditor.style.background = "#282828";
    textEditor.style.padding = "10px";
    textEditor.style.zIndex = "1000";
    textEditor.style.border = "2px solid #444";
    textEditor.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";

    let titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Enter title";
    titleInput.style.width = "100%";
    titleInput.style.marginBottom = "10px";
    titleInput.style.background = "#383838";
    titleInput.style.border = "1px solid #484848";
    titleInput.style.padding = "8px";
    titleInput.style.borderRadius = "4px";
    
    let textInput = document.createElement("textarea");
    textInput.placeholder = "Write your text here...";
    textInput.style.width = "100%";
    textInput.style.minHeight ="300px";
    textInput.style.marginBottom = "10px";
    textInput.style.background = "#383838";
    textInput.style.border = "1px solid #484848";
    textInput.style.padding = "8px";
    textInput.style.borderRadius = "4px";
    textInput.style.resize = "vertical";

    let saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.style.width = "100%";
    saveButton.style.background = "#383838";
    saveButton.style.border = "none";
    saveButton.style.padding = "10px 20px";
    saveButton.style.cursor = "pointer";
    saveButton.style.borderRadius = "8px";
    saveButton.style.color = "white";
    saveButton.style.fontSize = "14px";
    saveButton.onclick = () => saveText(titleInput.value, textInput.value, textEditor);

    let closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.width = "100%";
    closeButton.style.marginTop = "10px";
    closeButton.style.background = "#383838";
    closeButton.style.border = "none";
    closeButton.style.padding = "10px 20px";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "8px";
    closeButton.style.color = "white";
    closeButton.style.fontSize = "14px";
    closeButton.onclick = () => textEditor.remove();

    textEditor.appendChild(titleInput);
    textEditor.appendChild(textInput);
    textEditor.appendChild(saveButton);
    textEditor.appendChild(closeButton);
    document.body.appendChild(textEditor);
}

function saveText(title, text, editor) {
    if (!title || !text) return;
    let texts = JSON.parse(localStorage.getItem("savedTexts")) || [];
    texts.push({ title, text });
    localStorage.setItem("savedTexts", JSON.stringify(texts));
    displaySavedTexts();
    editor.remove();
}

function displaySavedTexts() {
    let writeTextArea = document.getElementById("write-text-area");

    const existingTextCards = writeTextArea.querySelectorAll(".file-card-wrapper");
    existingTextCards.forEach(card => card.remove());

    let texts = JSON.parse(localStorage.getItem("savedTexts")) || [];
    texts.forEach((item, index) => {
        const fileCardWrapper = document.createElement("div");
        fileCardWrapper.classList.add("file-card-wrapper");
        const fileCard = document.createElement("div");
        fileCard.classList.add("file-card");

        const displayTextTitle = item.title.length > 10 ? item.title.substring(0, 10) + "..." : item.title;
        fileCard.textContent = displayTextTitle;
        fileCard.onclick = (event) => {
            event.stopPropagation();
            openSavedText(item); 
        };

        const removeBtn = document.createElement("button");
        removeBtn.classList.add("remove-btn");

        const removeIcon = document.createElement("i");
        removeIcon.classList.add("ri-delete-bin-line");
        
        removeBtn.textContent = "Remove ";
        removeBtn.appendChild(removeIcon); 
        removeBtn.onclick = (event) => {

            event.stopPropagation();
            removeSavedText(index);
        };

        fileCardWrapper.appendChild(fileCard);
        fileCardWrapper.appendChild(removeBtn);

        writeTextArea.appendChild(fileCardWrapper);
    });
}

function openSavedText(item) {
    let textPopup = document.createElement("div");
    textPopup.style.position = "fixed";
    textPopup.style.top = "50%";
    textPopup.style.left = "50%";
    textPopup.style.transform = "translate(-50%, -50%)";
    textPopup.style.width = "500px";
    textPopup.style.height = "400px";
    textPopup.style.background = "#282828";
    textPopup.style.padding = "10px";
    textPopup.style.zIndex = "1000";
    textPopup.style.border = "2px solid #444";
    textPopup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    textPopup.style.display = "flex";
    textPopup.style.flexDirection = "column";
    
    let title = document.createElement("h3");
    title.innerText = item.title;
    
    let content = document.createElement("p");
    content.innerText = item.text;
    content.style.flexGrow = "1";
    
    let closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    closeBtn.style.width = "100%";
    closeBtn.style.background = "#383838";
    closeBtn.style.border = "none";
    closeBtn.style.padding = "10px 20px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.borderRadius = "8px";
    closeBtn.style.color = "white";
    closeBtn.style.fontSize = "14px";
    closeBtn.onclick = () => textPopup.remove();
    
    textPopup.appendChild(title);
    textPopup.appendChild(content);
    textPopup.appendChild(closeBtn);
    document.body.appendChild(textPopup);
}



function removeSavedText(index) {
    let texts = JSON.parse(localStorage.getItem("savedTexts")) || [];
    texts.splice(index, 1);
    localStorage.setItem("savedTexts", JSON.stringify(texts));
    displaySavedTexts(); 
}

displaySavedTexts();

      // Handle file uploads
           function handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const fileName = file.name;
                const fileURL = URL.createObjectURL(file);
                addFileCard(fileName, fileURL);
                saveFileToLocalStorage(fileName, fileURL);
            }
        }
        function addFileCard(fileName, fileURL) {
            let filediv = document.querySelector("#storage-area");
            
            const displayFileName = fileName.length > 13 ? fileName.substring(0, 13) + "..." : fileName;
            const fileCard = document.createElement("div");
            fileCard.classList.add("file-card");
            fileCard.textContent = displayFileName;
            fileCard.onclick = () => downloadFile(fileURL);

            const removeBtn = document.createElement("button");
            removeBtn.classList.add("remove-btn");

            const removeIcon = document.createElement("i");
            removeIcon.classList.add("ri-delete-bin-line");
        
            removeBtn.textContent = "Remove ";
            removeBtn.appendChild(removeIcon);
            removeBtn.onclick = (event) => confirmRemove(event, fileName, fileCardWrapper);
        
            const fileCardWrapper = document.createElement("div");
            fileCardWrapper.classList.add("file-card-wrapper");
            fileCardWrapper.appendChild(fileCard);
            fileCardWrapper.appendChild(removeBtn);
        
            filediv.appendChild(fileCardWrapper);
        }
        
        function confirmRemove(event, fileName, fileCardWrapper) {
            event.stopPropagation();
        
            const confirmation = confirm(`Are you sure you want to remove ${fileName}?`);
            if (confirmation) {
                removeFileFromLocalStorage(fileName);
                fileCardWrapper.remove();
            }
        }
        
        function saveFileToLocalStorage(fileName, fileURL) {
            const files = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
            files.push({ fileName, fileURL });
            localStorage.setItem("uploadedFiles", JSON.stringify(files));
        }

        function removeFileFromLocalStorage(fileName) {
            const files = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
            const updatedFiles = files.filter(file => file.fileName !== fileName);
            localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
        }

        function loadSavedFiles() {
            const files = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
            files.forEach(file => addFileCard(file.fileName, file.fileURL));
        }

        function downloadFile(file) {
            const a = document.createElement("a");
            a.href = file;
            a.download = file;
            a.click();
        }

        window.onload = loadSavedFiles;

        function copyToClipboard(command) {
            navigator.clipboard.writeText(command).then(() => {
            }).catch((error) => {
                console.error("Error copying text: ", error);
            });
        }

        function createSign() {
            let iframeContainer = document.createElement("div");
            iframeContainer.id = "iframe-sign-container";
            iframeContainer.style.position = "fixed";
            iframeContainer.style.top = "50%";
            iframeContainer.style.left = "50%";
            iframeContainer.style.transform = "translate(-50%, -50%)";
            iframeContainer.style.width = "40%";
            iframeContainer.style.height = "60%";
            iframeContainer.style.backgroundColor = "white";
            iframeContainer.style.zIndex = "9999";
            iframeContainer.style.border = "2px solid #444";
            iframeContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
            iframeContainer.style.cursor = "move";
            iframeContainer.style.resize = "both";
            iframeContainer.style.overflow = "hidden";

            let header = document.createElement("div");
            header.style.backgroundColor = "#444";
            header.style.color = "white";
            header.style.padding = "10px";
            header.style.cursor = "move";
            header.textContent = "Sign Editor";
            iframeContainer.appendChild(header);

            let iframe = document.createElement("iframe");
            iframe.src = "sign.html";  
            iframe.style.width = "100%";
            iframe.style.height = "calc(100% - 40px)";  
            iframe.style.border = "none";
            iframeContainer.appendChild(iframe);

            let closeButton = document.createElement("button");
            closeButton.textContent = "Close";
            closeButton.style.position = "absolute";
            closeButton.style.top = "10px";
            closeButton.style.right = "10px";
            closeButton.style.backgroundColor = "#444";
            closeButton.style.color = "white";
            closeButton.style.border = "none";
            closeButton.style.cursor = "pointer";
            closeButton.onclick = () => iframeContainer.remove();
            iframeContainer.appendChild(closeButton);

            document.body.appendChild(iframeContainer);

            header.onmousedown = dragMouseDown;

            let offsetX = 0;
            let offsetY = 0;

            function dragMouseDown(e) {
                e.preventDefault();
                offsetX = e.clientX - iframeContainer.offsetLeft;
                offsetY = e.clientY - iframeContainer.offsetTop;
                document.onmouseup = closeDragElement;
                document.onmousemove = dragMouseMove;
            }

            function dragMouseMove(e) {
                e.preventDefault();
                let posX = e.clientX - offsetX;
                let posY = e.clientY - offsetY;
                iframeContainer.style.left = posX + "px";
                iframeContainer.style.top = posY + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }

            let resizeHandle = document.createElement("div");
            resizeHandle.style.position = "absolute";
            resizeHandle.style.right = "0";
            resizeHandle.style.bottom = "0";
            resizeHandle.style.width = "20px";
            resizeHandle.style.height = "20px";
            resizeHandle.style.backgroundColor = "#444";
            resizeHandle.style.cursor = "se-resize";
            iframeContainer.appendChild(resizeHandle);

            resizeHandle.onmousedown = initResize;

            let startX, startY, startWidth, startHeight;

            function initResize(e) {
                e.preventDefault();
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(document.defaultView.getComputedStyle(iframeContainer).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(iframeContainer).height, 10);
                document.onmouseup = stopResize;
                document.onmousemove = doResize;
            }

            function doResize(e) {
                e.preventDefault();
                let newWidth = startWidth + (e.clientX - startX);
                let newHeight = startHeight + (e.clientY - startY);
                iframeContainer.style.width = newWidth + "px";
                iframeContainer.style.height = newHeight + "px";
            }

            function stopResize() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }

        function toggleWEmenu() {
            let WEicon = document.querySelector("#world-edit-btn i");
            let WEMENU = document.getElementById("World-edit-box");
            let WEbutton = document.getElementById("world-edit-btn");
          
            if (WEicon.classList.contains("ri-arrow-left-s-line")) {
                WEicon.classList.remove("ri-arrow-left-s-line");
                WEicon.classList.add("ri-arrow-down-s-line");

                WEbutton.style.borderRadius ="10px 10px 0 0";
                WEMENU.style.display = "flex";
            } else {
                WEicon.classList.remove("ri-arrow-down-s-line");
                WEicon.classList.add("ri-arrow-left-s-line");

                WEbutton.style.borderRadius ="10px";
                WEMENU.style.display = "none";
            }
        }
