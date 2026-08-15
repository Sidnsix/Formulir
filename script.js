document.getElementById('formPendaftaran').addEventListener('submit', function(event) {
    // Mencegah form langsung berpindah halaman (untuk simulasi testing)
    event.preventDefault();

    // Mengambil semua data dari inputan formulir
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const kelamin = document.querySelector('input[name="kelamin"]:checked').value;
    const negara = document.getElementById('negara').value;
    const pesan = document.getElementById('pesan').value;

    // Logika Validasi: Password minimal harus 6 karakter
    if (password.length < 6) {
        alert('Peringatan: Password minimal harus 6 karakter!');
        return;
    }

    // Memunculkan pop-up teks penanda sukses pendaftaran
    alert(`Pendaftaran Berhasil!\n\nSelamat datang, ${username}.\nNegara: ${negara}\nJenis Kelamin: ${kelamin}`);
});
