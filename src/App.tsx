import { useState } from "react";
import "./App.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaperPlaneIcon, UpdateIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { v4 as uuid } from "uuid";
import useChatScroll from "./lib/useChatScroll";
import { useToast } from "@/components/ui/use-toast";

type MessageType = {
    message: string;
    author: "user" | "assistant";
    id: string;
};

const user_avatar_map = {
    user: "https://source.boringavatars.com/beam?colors=FDCFBF,FEB89F,E23D75,5F0D3B,742365",
    assistant: "https://source.boringavatars.com/marble?colors=0A0310,49007E,FF005B,FF7D10,FFB238",
};

function App() {
    const [history, setHistory] = useState<MessageType[]>([]);
    const [data, setData] = useState("");
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useChatScroll([loading, data]);
    const { toast } = useToast();

    function handleSubmit() {
        if (input) {
            const new_arr: MessageType[] = [
                ...history,
                {
                    message: input,
                    author: "user",
                    id: uuid(),
                },
            ];
            setHistory(new_arr);
            fetchData(historyToPrompt(new_arr));
        }
    }

    const historyToPrompt = (history_arr: MessageType[]) => {
        let p = "";

        for (let i = 0; i < history_arr.length; i++) {
            if (history_arr[i].author === "assistant") p += " " + history_arr[i].message.trim() + " </s>";

            if (history_arr[i].author === "user") p += "[INST] " + history_arr[i].message.trim() + " [/INST]";
        }

        return p;
    };

    const fetchData = async (prompt: string) => {
        setData("");
        setInput("");
        try {
            setLoading(true);
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/generate-stream?` +
                    new URLSearchParams({ prompt: `${prompt}` }).toString(),
            );
            if (!response.ok || !response.body) {
                throw response.statusText;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let complete_data = "";

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    setLoading(false);
                    break;
                }

                let decodedChunk = decoder.decode(value, { stream: true });
                if (decodedChunk.endsWith("</s>")) decodedChunk = decodedChunk.replace("</s>", "");

                complete_data += decodedChunk;
                setData(prevValue => `${prevValue}${decodedChunk}`);
            }

            setHistory(prev => [
                ...prev,
                {
                    message: complete_data,
                    author: "assistant",
                    id: uuid(),
                },
            ]);
        } catch (error) {
            setLoading(false);
            console.log(error);
            toast({
                title: "Some error occured",
                description: "Please refresh the page to start a new chat session",
            });
        }
    };

    return (
        <div className="h-full grid grid-cols-1 grid-rows-1 space-y-2 pt-12">
            <div
                ref={scrollRef}
                className="h-full overflow-y-hidden hover:overflow-y-auto active:overflow-y-auto focus:overflow-y-auto"
            >
                {history.length === 0 && !loading ? (
                    <div className="h-full grid place-content-center pointer-events-none select-none">
                        <h1 className="text-5xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-bold tracking-tighter text-center opacity-5">
                            Mistral Chat
                        </h1>
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="flex flex-col space-y-4">
                            {history.map(h => (
                                <div key={h.id} className="w-full flex flex-col pt-1.5">
                                    <div className="text-sm font-bold flex items-center space-x-2">
                                        <Avatar>
                                            <AvatarImage src={user_avatar_map[h.author]} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                        <h5>{h.author[0].toUpperCase() + h.author.substring(1)}</h5>
                                    </div>
                                    <div lang="en" className="break-words hyphens-auto text-slate-400 ml-12 mr-1">
                                        {h.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Generator */}
                        {loading && (
                            <div className="w-full flex flex-col pt-1.5 my-4">
                                <div className="text-sm font-bold flex items-center space-x-2">
                                    <Avatar>
                                        <AvatarImage src={user_avatar_map["assistant"]} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <h5>Assistant</h5>
                                    <div className="h-10 w-10 flex items-center justify-center">
                                        <UpdateIcon className="animate-spin" />
                                    </div>
                                </div>
                                <div lang="en" className="break-words hyphens-auto text-slate-400 ml-12 mr-1">
                                    {data}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={user_avatar_map["user"]} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Input
                    type="text"
                    value={input}
                    readOnly={loading}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Start typing..."
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            handleSubmit();
                        }
                    }}
                />
                <Button
                    onClick={() => {
                        handleSubmit();
                    }}
                >
                    <PaperPlaneIcon />
                </Button>
            </div>
        </div>
    );
}

export default App;
