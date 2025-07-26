export default class BlobManager {
    /**
     * @param blobMimes Mime types for the image blobs, by decreasing preference order.
     */
    constructor(
        private canvas: () => HTMLCanvasElement,
        private blobMimes: string[] = [ "image/webp", "image/png" ],
    ) {}

    private async getBlobs() {
        const blobs: Record<string, Blob> = {};

        await Promise.allSettled(this.blobMimes.map(mime =>
            new Promise<void>(resolve => {
                this.canvas().toBlob(blob => {
                    if (blob === null) {
                        console.warn(`Failed to extract data as ${mime} from canvas`);
                    } else {
                        blobs[mime] = blob;
                    }
                    resolve();
                }, mime, 1.);
            })
        ));

        return blobs;
    }

    private url: string = "";
    public async downloadCanvas(filenameNoExtension = "image") {
        const blobs = await this.getBlobs();
        const mime = this.blobMimes.find(mime => blobs[mime] !== undefined);
        if (mime === undefined) {
            console.error("No blobs available for download");
            return;
        }

        const blob = blobs[mime];
        const a = document.createElement("a");
        a.download = `${filenameNoExtension}.${mime.split("/").at(-1)}`;
        if (this.url) {
            URL.revokeObjectURL(this.url);
        }
        a.href = this.url = URL.createObjectURL(blob);
        a.click();
    }

    public async copyCanvas() {
        const blobs = await this.getBlobs();

        for (const mime of this.blobMimes) {
            if (ClipboardItem.supports && !ClipboardItem.supports(mime)) {
                console.warn(`ClipboardItem does not support ${mime}`);
                continue;
            }

            const blob = blobs[mime];
            if (!blob) {
                continue;
            }

            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
                ]);
            } catch (e) {
                console.error(`Failed to copy canvas to clipboard as ${mime}: ${e}`);
                continue;
            }
            console.log(`Copied canvas as ${mime} to clipboard`);
            return;
        }
        console.error("No blobs to copy");
    }
}
