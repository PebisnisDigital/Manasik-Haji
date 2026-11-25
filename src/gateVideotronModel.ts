/** All dimensions are in scene metres; the ground-floor entrance and queue geometry stay unchanged. */
export const GATE_OFFICE={width:22,depth:4.5,z:-8.7,groundTop:3.84,floorHeight:3.4,floors:4} as const;
export const GATE_VIDEOTRON={videoId:'vj8Utj9HGPA',width:10.24,height:5.76,x:0,y:7.24,z:-6.12,iframeWidth:640,iframeHeight:360} as const;
export function youtubeGateEmbed(videoId=GATE_VIDEOTRON.videoId){
 if(!/^[A-Za-z0-9_-]{11}$/.test(videoId))throw Error('Invalid YouTube video ID');
 const p=new URLSearchParams({autoplay:'1',mute:'1',loop:'1',playlist:videoId,controls:'0',playsinline:'1',disablekb:'1',fs:'0',rel:'0'});
 return 'https://www.youtube.com/embed/'+videoId+'?'+p;
}
