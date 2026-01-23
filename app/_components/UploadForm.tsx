'use client'
import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import rateInput from '../_actions/rateInput'

type Inputs = {
  imgUrl?: string
  text?: string
}
export default function UploadForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const {
    register,
    handleSubmit,
    watch,
  } = useForm<Inputs>()
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsLoading(true)
    let payload = ""
    let type: "text" | "image" = "image"
    if (data.imgUrl) {
      payload = data.imgUrl
      type = "image"
    } else if (data.text) {
      payload = data.text
      type = "text"
    }
    if (payload.length > 0) {
      const response = await rateInput(payload, type)
      setResult(response)
    }
    setIsLoading(false)
  }
  const imgSrc = watch("imgUrl")
  const text = watch("text")
  let hasInput = (imgSrc && imgSrc.length > 0) || (text && text.length > 0)
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full max-w-full flex gap-4">
          <div className="w-full border-2 border-zinc-200 rounded-md p-12">
            <p className="font-bold">Text input</p>
            <textarea placeholder="Long-form text here" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md mb-4" {...register("text")} />
            <p className="font-bold">Image preview</p>
            <label className="block">
              Paste a valid URL below.<br/>
              <input placeholder="https://" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md mb-4" {...register("imgUrl")} />
              { imgSrc && <img className="block mb-4" src={imgSrc} />}
              <ul className="pl-4 list-disc">
                <li>https://upload.wikimedia.org/wikipedia/commons/c/cc/Reptilian_Fabric.jpg</li>
                <li>https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.studenti.stbm.it%2Fimages%2F2016%2F11%2F07%2Fcomposizione-su-bianco---kandinsky-orig.jpeg&f=1&nofb=1&ipt=5c47160e938dc12af958b35aa0daf169d58ab7acbe0a06bdcd85fa8811f3d7f5</li>
              </ul>
            </label>
          </div>
          <div className="w-full p-12 border-2 rounded-md border-gray-200">
              <div>
                <p className="font-bold">Your assessment</p>
                <label className="block mb-2">
                  Sincerity <input
                  placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
                </label>
                <label className="block mb-2">
                  Excitement <input
                  placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
                </label>
                <label className="block mb-2">
                  Competence <input
                  placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
                </label>
                <label className="block mb-2">
                  Sophistication <input
                  placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
                </label>
                <label className="block mb-2">
                  Ruggedness <input
                  placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
                </label>
              </div>
              <div className="border-t-2 border-zinc-200 mt-8 pt-8">
                <p className="font-bold">Qwen3 VL 235B A22B Instruct Assessment</p>
                <button 
                disabled={!hasInput}
                className="rounded-md bg-green-300 disabled:border-red-300 disabled:border-2 disabled:bg-red-200 py-1.5 px-3">
                  {!hasInput ? "Waiting for input..." : "Analyze input"}
                </button>
                { isLoading && <div>Analyzing...</div>}
                { result && <pre className="mt-2 border-2 border-zinc-200 p-4 text-zinc-700">{result.message.content}</pre> }
              </div>
          </div>
        </div>
      </form>

    </div>
  )
}