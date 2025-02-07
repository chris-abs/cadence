export function usePrintQR() {
  const printQRCode = (qrImage: string, qrCode: string) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .qr-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
              }
              .qr-image {
                width: 400px;
                height: 400px;
                object-fit: contain;
              }
              .qr-code {
                font-family: monospace;
                font-size: 14px;
                color: #666;
              }
              @media print {
                @page {
                  size: auto;
                  margin: 0;
                }
                body {
                  min-height: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrImage}" alt="QR Code" class="qr-image" />
              <span class="qr-code">${qrCode}</span>
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return { printQRCode }
}
