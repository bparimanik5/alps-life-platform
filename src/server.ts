import {createApp} from './app';
const port=Number(process.env.PORT??4000);createApp().listen(port,()=>console.log(`ALPS mock API listening on http://localhost:${port}`));
