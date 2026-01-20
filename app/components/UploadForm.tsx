'use client'
import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import rateImage from '../actions/rateImage'

type Inputs = {
  imgUrl: string
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
    const response = await rateImage(data.imgUrl)
    setResult(response)
    setIsLoading(false)
  }
  const imgSrc = watch("imgUrl")
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>
          Paste a valid URL below.<br/>
          <input placeholder="https://" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" {...register("imgUrl")} />
        </label>
        <br/><div className="border-2 border-zinc-200 rounded-md my-4 p-12">
          <p className="font-bold">Image preview</p>
          {
            imgSrc 
              ? <img src={imgSrc} />
              : 'Waiting for an image...'
          }
        </div>
        <br/>
        <button 
        disabled={!imgSrc}
        className="rounded-md bg-green-300 disabled:border-red-300 disabled:border-2 disabled:bg-red-200 py-1.5 px-3">
          {!imgSrc ? "Waiting for image..." : "Analyze Image"}
        </button>
      </form>

      <div className="my-4 p-12 border-2 rounded-md border-gray-200">
          <p className="font-bold">Qwen3 VL 235B A22B Instruct Assessment</p>
          {!isLoading && !result && <div>Waiting for assessment.</div>}
          { isLoading && <div>Analyzing...</div>}
          { result && <pre>{result.message.content}</pre> }
      </div>

      <div>
        <p>Your assessment</p>
        <label className="block">
          Sincerity <input
          placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
        </label>
        <label className="block">
          Excitement <input
          placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
        </label>
        <label className="block">
          Competence <input
          placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
        </label>
        <label className="block">
          Sophistication <input
          placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
        </label>
        <label className="block">
          Ruggedness <input
          placeholder="1-5" className="py-1.5 px-3 border-2 border-zinc-200 rounded-md" />
        </label>
      </div>

    </div>
  )
}