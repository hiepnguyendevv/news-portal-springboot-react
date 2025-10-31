export const isVideoUrl = (url) => {
  if (!url) return false;
  const isVideoByExt = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  const isCloudinaryVideo = url.includes('/video/');
  return isVideoByExt || isCloudinaryVideo;
};
