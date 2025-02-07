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

        // Remove file data from localStorage
        function removeFileFromLocalStorage(fileName) {
            const files = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
            const updatedFiles = files.filter(file => file.fileName !== fileName);
            localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
        }

        // Load saved files from localStorage when the page is loaded
        function loadSavedFiles() {
            const files = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
            files.forEach(file => addFileCard(file.fileName, file.fileURL));
        }

        // Trigger file download
        function downloadFile(file) {
            const a = document.createElement("a");
            a.href = file;
            a.download = file;
            a.click();
        }

        // Load saved files on page load
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

          // Draggable functionality
let dragContainer = document.querySelector('.top-right-box');
let isDragging = false;
let offsetX, offsetY;

dragContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - dragContainer.getBoundingClientRect().left;
  offsetY = e.clientY - dragContainer.getBoundingClientRect().top;
  
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);
});

function drag(e) {
  if (isDragging) {
    dragContainer.style.left = `${e.clientX - offsetX}px`;
    dragContainer.style.top = `${e.clientY - offsetY}px`;
  }
}

function stopDragging() {
  isDragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDragging);
}
