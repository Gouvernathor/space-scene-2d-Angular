export default async () =>
    new Promise<number>(resolve =>
        requestAnimationFrame(resolve));
