;; snak-badges - rank NFTs minted by qualifying season placement. The
;; contract trusts the player to bring their own rank attestation - no
;; whitelist, no owner gating beyond the URI.

(define-non-fungible-token snak-badge uint)

(define-constant ERR-NOT-EARNED (err u600))
(define-constant ERR-ALREADY-MINTED (err u601))
(define-constant ERR-NOT-OWNER (err u602))

(define-data-var owner principal tx-sender)
(define-data-var base-uri (string-ascii 96) "https://snak.timjosh507.workers.dev/api/badges/")
(define-data-var next-token-id uint u0)

(define-map minted { user: principal, season: uint } bool)

(define-public (claim-rank-badge (season uint) (rank uint))
  (let ((id (var-get next-token-id)))
    (asserts! (> rank u0) ERR-NOT-EARNED)
    (asserts! (is-none (map-get? minted { user: tx-sender, season: season })) ERR-ALREADY-MINTED)
    (try! (nft-mint? snak-badge id tx-sender))
    (map-set minted { user: tx-sender, season: season } true)
    (var-set next-token-id (+ id u1))
    (print { event: "claimed", id: id, season: season, rank: rank })
    (ok id)))

(define-public (set-base-uri (new-uri (string-ascii 96)))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-NOT-OWNER)
    (var-set base-uri new-uri)
    (ok true)))

(define-read-only (get-token-uri (id uint))
  (ok (some (var-get base-uri))))
