// Design By
// - https://dribbble.com/shots/13992184-File-Uploader-Drag-Drop

// Select Upload-Area
const uploadArea = document.querySelector("#uploadArea");

// Select Drop-Zoon Area
const dropZoon = document.querySelector("#dropZoon");

// Slect File Input
const fileInput = document.querySelector("#fileInput");

// ToolTip Data
const toolTipData = document.querySelector(".upload-area__tooltip-data");

const resultScreen = document.querySelector("#result-screen");

const resultScreenClose = document.querySelector("#close-result-screen");

const statusTool = document.querySelector("#status");

// Images Types
const imagesTypes = ["xlsx"];

// Append Images Types Array Inisde Tooltip Data
toolTipData.innerHTML = [...imagesTypes].join(", .");

// When (drop-zoon) has (dragover) Event
dropZoon.addEventListener("dragover", function (event) {
  // Prevent Default Behavior
  event.preventDefault();

  // Add Class (drop-zoon--over) On (drop-zoon)
  dropZoon.classList.add("drop-zoon--over");
});

// When (drop-zoon) has (dragleave) Event
dropZoon.addEventListener("dragleave", function (event) {
  // Remove Class (drop-zoon--over) from (drop-zoon)
  dropZoon.classList.remove("drop-zoon--over");
});

// When (drop-zoon) has (drop) Event
dropZoon.addEventListener("drop", function (event) {
  // Prevent Default Behavior
  event.preventDefault();

  // Remove Class (drop-zoon--over) from (drop-zoon)
  dropZoon.classList.remove("drop-zoon--over");

  // Select The Dropped File
  const file = event.dataTransfer.files[0];

  // Call Function uploadFile(), And Send To Her The Dropped File :)
  uploadFile(file);
});

// When (drop-zoon) has (click) Event
dropZoon.addEventListener("click", function (event) {
  // Click The (fileInput)
  fileInput.click();
});

// When (fileInput) has (change) Event
fileInput.addEventListener("change", function (event) {
  // Select The Chosen File
  const file = event.target.files[0];

  // Call Function uploadFile(), And Send To Her The Chosen File :)
  uploadFile(file);
});

// Upload File Function
const uploadFile = async (file) => {
  resultScreen.style.display = "block";
  statusTool.style.display = 'block'
  statusTool.innerHTML = "Đang xử lý, vui lòng chờ đợi";
  document.getElementById("table-result").innerHTML = '';
  fileInput.value = null;
  // FileReader()
  const fileReader = new FileReader();
  // File Type
  const fileType = file.type;
  // File Size
  const fileSize = file.size;
  const data = await file.arrayBuffer();
  /* data is an ArrayBuffer */
  const workbook = XLSX.read(data);
  const sheetData = workbook.Sheets[workbook.SheetNames[0]];
  const colARegex = new RegExp(/A[0-9]+/gi);
  const asinInfoList = [];
  for (const key in sheetData) {
    if (Object.hasOwnProperty.call(sheetData, key)) {
      colARegex.lastIndex = 0;
      if (colARegex.test(key.toString())) {
        const index = key.split("A")[1];
        const colBIndex = `B${index}`;
        if (index > 1) {
          asinInfoList.push({
            acc: sheetData[key]?.w || undefined,
            asin: sheetData[colBIndex]?.w || undefined,
          });
        }
      }
    }
  }
  const result = await window.toolApi.checkAsin(asinInfoList);
  if (!result) {
    statusTool.innerHTML =
      "Có lỗi xảy ra, vui lòng thực hiện lại hoặc báo lại IT để xử lý";
  } else {
    statusTool.innerHTML = "";
    statusTool.style.display = 'none'
    const newTable = document.createElement("table");
    newTable.innerHTML =
      "<thead><th>Tài khoản</th><th>Asin</th><th>Mô tả</th><th>Báo cáo</th></thead>";
    for (rs of result) {
      const newRow = document.createElement("tr");
      const tdAcc = document.createElement("td");
      const tdAsin = document.createElement("td");
      const tdDes = document.createElement("td");
      const tdReport = document.createElement("td");
      if (
        rs.checkResult &&
        rs.checkResult.includes("noOffers") &&
        rs.checkResult.includes("options") &&
        rs.checkResult.includes("buybox") &&
        rs.checkResult.includes("result")
      ) {
        tdAcc.classList.add("success");
        tdAsin.classList.add("success");
        tdDes.classList.add("success");
        tdReport.classList.add("success");
      } else {
        tdAcc.classList.add("fail");
        tdAsin.classList.add("fail");
        tdDes.classList.add("fail");
        tdReport.classList.add("fail");
      }
      tdAcc.textContent = rs.acc;
      tdAsin.textContent = rs.asin;
      tdDes.textContent = renderDes(rs.checkResult);
      tdReport.textContent = renderReport(rs.checkResult);
      newRow.appendChild(tdAcc);
      newRow.appendChild(tdAsin);
      newRow.appendChild(tdDes);
      newRow.appendChild(tdReport);
      newTable.appendChild(newRow);
    }

    const target = document.getElementById("table-result");
    target.style.display = "flex";
    target.appendChild(newTable);
  }

  if (fileValidate(fileType, fileSize)) {
  }
};

function renderDes(rs) {
  let des = "";
  if (!rs) {
    return des;
  }
  if (rs.includes("noResult")) {
    des += "search không ra thông tin gì,";
  }
  if (rs.includes("offfers")) {
    des += "có bb nhưng bị HJ,";
  }
  if (rs.includes("noBuyBox")) {
    des += "mất buybox,";
  }
  if (rs.includes("noOptions")) {
    des += "có bb nhưng không được ghép,";
  }
  return des;
}

function renderReport(rs) {
  let des = "";
  if (!rs) {
    return des;
  }
  if (rs.includes("noResult")) {
    des += "kiểm tra lại asin,";
  }
  if (rs.includes("offfers")) {
    des += "thay asin backup,";
  }
  if (rs.includes("noBuyBox")) {
    des += "thay asin backup,";
  }
  if (rs.includes("noOptions")) {
    des += "cần ghép lại";
  }
  return des;
}

function fileValidate(fileType, fileSize) {
  return true;
}

resultScreenClose.addEventListener("click", () => {
  resultScreen.style.display = "none";
});
