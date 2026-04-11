'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUser } from '@/src/contexts/UserContext';
import { sendMessage } from '@/src/lib/api/message';
import { toHexPreview } from '@/src/lib/hex';

const MAX_CHARS = 100;

export function ComposePanel() {
  const { user, setTransmitting } = useUser();
  const [text, setText] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const hexPreview = toHexPreview(text);
  const isTransmitting = user?.is_transmitting ?? false;
  const canSend = charCount > 0 && !isTransmitting;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) setText(val);
  }

  async function handleConfirm() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendMessage(text);
      if (res.error || !res.data) {
        setError(res.error?.message ?? 'Failed to send message');
        return;
      }
      setTransmitting(res.data);
      setText('');
      setConfirmOpen(false);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSending(false);
    }
  }

  let counterClass = 'text-xs font-mono ';
  if (charCount >= MAX_CHARS) counterClass += 'text-red-400';
  else if (charCount >= 80) counterClass += 'text-amber-400';
  else counterClass += 'text-gray-500';

  return (
    <div className="flex flex-col gap-2 w-80 p-3 bg-gray-950 border border-gray-800 rounded-lg">
      {/* HEX preview */}
      <div className="min-h-6 font-mono text-xs text-green-400 break-all">
        {hexPreview || <span className="text-gray-700">HEX preview</span>}
      </div>

      {/* Textarea */}
      <Textarea
        value={text}
        onChange={handleChange}
        disabled={isTransmitting}
        placeholder="Compose your signal..."
        rows={3}
        className="resize-none font-mono text-sm bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600"
      />

      {/* Footer: char counter + send button */}
      <div className="flex items-center justify-between">
        <span className={counterClass}>
          {charCount} / {MAX_CHARS}
        </span>
        <Button
          size="sm"
          disabled={!canSend}
          onClick={() => setConfirmOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs"
        >
          {isTransmitting ? 'TRANSMITTING...' : 'TRANSMIT'}
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="font-mono text-amber-400">Confirm Transmission</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              This will broadcast your message. Transmission cannot be recalled once started.
            </p>
            <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-200 break-all">
              {text}
            </div>
            <div className="bg-gray-900 rounded p-3 font-mono text-xs text-green-400 break-all">
              {hexPreview}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 font-mono"
            >
              CANCEL
            </Button>
            <Button
              size="sm"
              disabled={sending}
              onClick={handleConfirm}
              className="bg-amber-500 hover:bg-amber-400 text-black font-mono"
            >
              {sending ? 'SENDING...' : 'CONFIRM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
