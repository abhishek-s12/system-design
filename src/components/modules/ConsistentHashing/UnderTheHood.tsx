"use client";

import { useEffect, useState } from "react";
import { useHashRingStore } from "@/stores/hashRingStore";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export function UnderTheHood() {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const { lastMovedKeys, keys } = useHashRingStore();

  // Highlight line simulation to show lookup execution path on state change
  useEffect(() => {
    if (keys.length === 0) return;

    let step = 0;
    const interval = setInterval(() => {
      if (step === 0) setHighlightLine(2);      // Hash key
      else if (step === 1) setHighlightLine(6); // Binary search loop
      else if (step === 2) setHighlightLine(14); // Wrap-around check
      else if (step === 3) setHighlightLine(17); // Return nodeId
      else {
        setHighlightLine(null);
        clearInterval(interval);
      }
      step++;
    }, 180);

    return () => clearInterval(interval);
  }, [keys.length, lastMovedKeys.length]);

  const codeLines = [
    { num: 1, text: "function lookupKey(key: string): string | null {" },
    { num: 2, text: "  const keyHash = fnv1a(key); // Step 1: Hash the key using FNV-1a" },
    { num: 3, text: "  if (ring.length === 0) return null;" },
    { num: 4, text: "" },
    { num: 5, text: "  // Step 2: Binary search for the first virtual node clockwise" },
    { num: 6, text: "  let low = 0, high = ring.length - 1, idx = 0;" },
    { num: 7, text: "  while (low <= high) {" },
    { num: 8, text: "    const mid = (low + high) >> 1;" },
    { num: 9, text: "    if (ring[mid].hash >= keyHash) {" },
    { num: 10, text: "      idx = mid;" },
    { num: 11, text: "      high = mid - 1;" },
    { num: 12, text: "    } else {" },
    { num: 13, text: "      low = mid + 1;" },
    { num: 14, text: "    }" },
    { num: 15, text: "  }" },
    { num: 16, text: "" },
    { num: 17, text: "  // Step 3: Wrap around to the start of the ring if necessary" },
    { num: 18, text: "  if (keyHash > ring[ring.length - 1].hash) {" },
    { num: 19, text: "    idx = 0;" },
    { num: 20, text: "  }" },
    { num: 21, text: "  return ring[idx].nodeId;" },
    { num: 22, text: "}" },
  ];

  return (
    <div className="flex flex-col bg-[#17181B] border border-[#8B8D93]/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-5 py-4 font-mono text-xs font-semibold text-[#E8E6E1]/80 hover:text-[#E8E6E1] transition-colors cursor-pointer select-none"
      >
        <span>UNDER THE HOOD: LOOKUP ALGORITHM</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="border-t border-[#8B8D93]/10 p-5 flex flex-col gap-5">
          {/* Debug Code Panel */}
          <div className="bg-[#0E0F11] border border-[#8B8D93]/10 rounded p-4 overflow-x-auto font-mono text-[11px] leading-5 text-[#E8E6E1]/90">
            {codeLines.map((line) => {
              const isHighlighted =
                highlightLine !== null &&
                ((highlightLine === 2 && line.num === 2) ||
                  (highlightLine === 6 && line.num >= 6 && line.num <= 15) ||
                  (highlightLine === 14 && line.num >= 17 && line.num <= 20) ||
                  (highlightLine === 17 && line.num === 21));

              return (
                <div
                  key={line.num}
                  className={`flex ${
                    isHighlighted ? "bg-[#E8A33D]/10 text-[#E8A33D]" : ""
                  }`}
                >
                  <span className="w-6 text-[#E8E6E1]/30 select-none text-right pr-2">
                    {line.num}
                  </span>
                  <pre className="whitespace-pre">{line.text}</pre>
                </div>
              );
            })}
          </div>

          {/* Production Citation */}
          <div className="bg-[#0E0F11]/40 border border-[#8B8D93]/10 rounded p-4 text-xs text-[#E8E6E1]/80">
            <h4 className="font-semibold font-mono text-[#E8A33D] uppercase tracking-wider mb-2 text-[10px]">
              What would break in production
            </h4>
            <p className="leading-relaxed">
              In a real production system (like DynamoDB or Cassandra), consistent hashing rings suffer from hotspots and imbalance if virtual node allocations are poorly tuned. FNV-1a is excellent for local, fast hashing, but real-world implementations require replication for high availability, gossiping protocols to sync ring memberships, and active handoff during partitions. Without virtual nodes, adding or removing a node causes massive load spikes on the immediate clockwise neighbor.
            </p>
            <div className="mt-3 flex items-center">
              <a
                href="https://www.allthingsdistributed.com/2007/10/dynamo-amazons-highly-available.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#E8A33D] hover:underline font-medium font-mono text-[10px]"
              >
                Read Amazon&apos;s Dynamo Paper <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
