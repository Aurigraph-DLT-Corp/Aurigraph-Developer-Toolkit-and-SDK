import io.quarkus.elytron.security.common.BcryptUtil;

public class GenerateHash {
    public static void main(String[] args) {
        String password = "admin123";
        String hash = BcryptUtil.bcryptHash(password, 12);
        System.out.println(hash);
    }
}
