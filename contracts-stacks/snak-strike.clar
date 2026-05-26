;; snak-strike - permissionless daily-strike streak counter. Anyone calls
;; daily-strike() once per cooldown; the contract counts and emits an event.
;; Used by clients to award free entries. No owner gating at all.

(define-constant ERR-TOO-SOON (err u900))

(define-data-var cooldown-blocks uint u132) ;; ~22h at 10-min blocks
(define-data-var grace-blocks uint u36) ;; ~6h grace before streak resets

(define-map last-strike principal uint)
(define-map strike-run principal uint)

(define-public (daily-strike)
  (let ((last (default-to u0 (map-get? last-strike tx-sender)))
        (run (default-to u0 (map-get? strike-run tx-sender)))
        (next-allowed (+ last (var-get cooldown-blocks)))
        (grace-end (+ last (+ (var-get cooldown-blocks) (var-get grace-blocks)))))
    (asserts! (or (is-eq last u0) (>= stacks-block-height next-allowed)) ERR-TOO-SOON)
    (let ((next-run (if (or (is-eq last u0) (> stacks-block-height grace-end)) u1 (+ run u1))))
      (map-set last-strike tx-sender stacks-block-height)
      (map-set strike-run tx-sender next-run)
      (print { event: "striked", who: tx-sender, run: next-run })
      (ok next-run))))

(define-read-only (current-streak (who principal))
  (default-to u0 (map-get? strike-run who)))

(define-read-only (next-eligible (who principal))
  (let ((last (default-to u0 (map-get? last-strike who))))
    (if (is-eq last u0) u0 (+ last (var-get cooldown-blocks)))))
