;; Snak - Stacks/Clarity port (draft)
;; Arena escrow that locks stake per player and pays the top score on settle.
;; Mirrors Snak.sol on the EVM side.

(define-constant ERR-NOT-OPEN (err u300))
(define-constant ERR-FULL (err u301))
(define-constant ERR-ALREADY-JOINED (err u302))
(define-constant ERR-ZERO-STAKE (err u303))
(define-constant ERR-DEADLINE-PASSED (err u304))
(define-constant ERR-NOT-SCORER (err u305))

(define-data-var owner principal tx-sender)
(define-data-var scorer principal tx-sender)
(define-data-var treasury principal tx-sender)
(define-data-var treasury-bps uint u500) ;; 5%

(define-map matches
  uint
  {
    creator: principal,
    stake: uint,
    max-players: uint,
    current-players: uint,
    deadline: uint,
    prize-pool: uint,
    status: uint, ;; 0=open 1=active 2=settled 3=cancelled
  })

(define-map match-players { match-id: uint, player: principal } uint) ;; score
(define-data-var next-match-id uint u0)

(define-public (create-match (stake uint) (max-players uint) (deadline uint))
  (let ((id (var-get next-match-id)))
    (asserts! (> stake u0) ERR-ZERO-STAKE)
    (asserts! (> deadline stacks-block-height) ERR-DEADLINE-PASSED)
    ;; TODO: SIP-010 transfer stake into contract
    (map-set matches id
      { creator: tx-sender, stake: stake, max-players: max-players,
        current-players: u1, deadline: deadline, prize-pool: stake, status: u0 })
    (map-set match-players { match-id: id, player: tx-sender } u0)
    (var-set next-match-id (+ id u1))
    (ok id)))

;; TODO: join-match - assert capacity, take stake, bump pool
;; TODO: submit-score - scorer-only writes
;; TODO: settle-match - pay winner minus treasury cut
;; TODO: forfeit / rescue-stake

(define-read-only (get-match (id uint))
  (map-get? matches id))
