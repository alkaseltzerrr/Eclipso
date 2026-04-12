import React, { useEffect, useState } from 'react'
import { Link2, Mail, UserPlus, UserCheck, UserX, Unlink2 } from 'lucide-react'
import { withCsrfHeader } from '../utils/csrf'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/api'

interface PartnerSummary {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  partner: {
    id: string
    username: string
    email: string
    avatar?: string | null
  } | null
}

interface PartnershipPayload {
  activePartnership: PartnerSummary | null
  incomingInvites: PartnerSummary[]
  outgoingInvites: PartnerSummary[]
}

const PartnerManager: React.FC = () => {
  const { refreshUser } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [data, setData] = useState<PartnershipPayload>({
    activePartnership: null,
    incomingInvites: [],
    outgoingInvites: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadPartnerships = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/partnerships', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to load partnerships'))
      }

      const payload = await response.json()
      setData(payload)
    } catch (loadError) {
      console.error('Load partnerships failed:', loadError)
      setError('Failed to load partnership state')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPartnerships()
  }, [])

  const invitePartner = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!inviteEmail.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const csrfHeaders = await withCsrfHeader({
        'Content-Type': 'application/json'
      })

      const response = await fetch('/api/users/partnership', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders,
        body: JSON.stringify({
          partnerEmail: inviteEmail.trim().toLowerCase()
        })
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to send invite'))
      }

      const payload = await response.json()
      setInviteEmail('')
      setSuccess(payload.message || 'Invite sent')
      await loadPartnerships()
      await refreshUser()
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Failed to send invite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const acceptInvite = async (id: string) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const csrfHeaders = await withCsrfHeader()
      const response = await fetch(`/api/users/partnership/${id}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to accept invite'))
      }

      setSuccess('Invite accepted')
      await loadPartnerships()
      await refreshUser()
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept invite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const declineInvite = async (id: string) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const csrfHeaders = await withCsrfHeader()
      const response = await fetch(`/api/users/partnership/${id}/decline`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to decline invite'))
      }

      setSuccess('Invite declined')
      await loadPartnerships()
      await refreshUser()
    } catch (declineError) {
      setError(declineError instanceof Error ? declineError.message : 'Failed to decline invite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const disconnectPartner = async (id: string) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const csrfHeaders = await withCsrfHeader()
      const response = await fetch(`/api/users/partnership/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: csrfHeaders
      })

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Failed to disconnect partnership'))
      }

      setSuccess('Partnership disconnected')
      await loadPartnerships()
      await refreshUser()
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : 'Failed to disconnect partnership')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-eclipse-black/60 backdrop-blur-sm rounded-xl border border-aurora-purple/20 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Link2 className="w-5 h-5 text-starlight-cyan" />
        <h3 className="font-orbitron text-lg text-starlight-cyan">Partnership</h3>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded border border-red-500/40 bg-red-500/10 text-red-200 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs">
          {success}
        </div>
      )}

      {isLoading && <div className="text-sm text-aurora-purple/80">Loading partnership...</div>}

      {!isLoading && data.activePartnership && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-aurora-purple/40 bg-aurora-purple/10">
            <p className="text-xs text-aurora-purple/70 mb-1">Active partner</p>
            <p className="text-starlight-cyan font-medium">{data.activePartnership.partner?.username}</p>
            <p className="text-xs text-aurora-purple/70">{data.activePartnership.partner?.email}</p>
          </div>
          <button
            disabled={isSubmitting}
            onClick={() => disconnectPartner(data.activePartnership!.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-nebula-rose/50 text-nebula-rose hover:bg-nebula-rose/10 disabled:opacity-50 transition-colors text-sm"
          >
            <Unlink2 className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}

      {!isLoading && !data.activePartnership && (
        <div className="space-y-4">
          <form onSubmit={invitePartner} className="space-y-2">
            <label className="text-xs text-aurora-purple/80">Invite by email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="partner@email.com"
                className="flex-1 px-3 py-2 text-sm bg-deep-space/50 border border-aurora-purple/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-aurora-purple"
              />
              <button
                type="submit"
                disabled={isSubmitting || !inviteEmail.trim()}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-aurora-purple to-nebula-rose text-white disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {data.incomingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-aurora-purple/80">Incoming invites</p>
              {data.incomingInvites.map((invite) => (
                <div key={invite.id} className="p-2 rounded border border-starlight-cyan/30 bg-starlight-cyan/5">
                  <p className="text-sm text-starlight-cyan">{invite.partner?.username}</p>
                  <p className="text-xs text-aurora-purple/70 mb-2">{invite.partner?.email}</p>
                  <div className="flex gap-2">
                    <button
                      disabled={isSubmitting}
                      onClick={() => acceptInvite(invite.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded border border-emerald-500/60 text-emerald-300 text-xs disabled:opacity-50"
                    >
                      <UserCheck className="w-3 h-3" />
                      Accept
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={() => declineInvite(invite.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded border border-nebula-rose/60 text-nebula-rose text-xs disabled:opacity-50"
                    >
                      <UserX className="w-3 h-3" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.outgoingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-aurora-purple/80">Pending outgoing</p>
              {data.outgoingInvites.map((invite) => (
                <div key={invite.id} className="p-2 rounded border border-aurora-purple/40 bg-aurora-purple/10">
                  <p className="text-sm text-starlight-cyan">{invite.partner?.username}</p>
                  <p className="text-xs text-aurora-purple/70">Awaiting response</p>
                </div>
              ))}
            </div>
          )}

          {data.incomingInvites.length === 0 && data.outgoingInvites.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-aurora-purple/70">
              <Mail className="w-4 h-4" />
              No pending invites
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PartnerManager
