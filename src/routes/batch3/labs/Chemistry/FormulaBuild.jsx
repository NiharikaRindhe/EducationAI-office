import { ArrowLeft, Atom } from "lucide-react"
import AtomData from "./AtomData"


export default function FormulaBuild() {
    return (
        <div>
        <header className="w-full px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
            <button
                onClick={() => navigate(-1)}
                className="p-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
            >
                <ArrowLeft size={30} />
            </button>
            <span className="font-bold text-blue-700 text-4xl">Periodic Table</span>
            </div>
        </header>

        <div>
            {AtomData.map(Atom => (
                <div>
                    <div>{Atom.name}</div>
                    <div>{Atom.element}</div>
                    <div>{Atom.number}</div>
                    <div>{Atom.symbol}</div>
                    <div>{Atom.atomic_mass}</div>
                </div>
            ))}
        </div>
        </div>
    )
}